import { getStories, getStoryDetail, addStory } from '../services/api.js';
import { openDB } from 'idb';

const DB_NAME = 'story-app';
const STORE_NAME = 'stories';
const QUEUE_STORE_NAME = 'story-queue';

async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        db.createObjectStore(QUEUE_STORE_NAME, { autoIncrement: true });
      }
    },
  });
}

const StoryModel = {
  async fetchAllStories() {
    try {
      const stories = await getStories();
      console.log('Mengambil story online:', stories.length);
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await Promise.all(stories.map((story) => tx.store.put({ ...story, isOffline: false })));
      await tx.done;
      return stories;
    } catch (error) {
      console.error('Gagal mengambil story:', error);
      return this.getAllStoriesOffline();
    }
  },

  async fetchStoryDetail(id) {
    try {
      const story = await getStoryDetail(id);
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await tx.store.put({ ...story, isOffline: false });
      await tx.done;
      return story;
    } catch (error) {
      console.error('Gagal mengambil detail story:', error);
      const db = await initDB();
      const story = await db.get(STORE_NAME, id);
      if (story) {
        console.log('Mengambil story offline:', id);
        return story;
      }
      throw new Error('Story tidak ditemukan di penyimpanan offline');
    }
  },

  async getAllStoriesOffline() {
    try {
      const db = await initDB();
      const stories = await db.getAll(STORE_NAME);
      console.log('Mengambil semua story offline:', stories.length);
      return stories || [];
    } catch (error) {
      console.error('Gagal mengambil semua story offline:', error);
      return [];
    }
  },

  async getOfflineStories() {
    try {
      const db = await initDB();
      const stories = await db.getAll(STORE_NAME);
      const offlineStories = stories.filter((story) => story.isOffline);
      console.log('Mengambil story offline lokal:', offlineStories.length);
      return offlineStories || [];
    } catch (error) {
      console.error('Gagal mengambil story offline lokal:', error);
      return [];
    }
  },

  async saveAndQueueStory(formData) {
    try {
      const photoBlob = formData.get('photo');
      const photoBase64 = await this.blobToBase64(photoBlob);

      const storyData = {
        id: formData.get('id'),
        name: 'Offline User',
        description: formData.get('description'),
        photoUrl: photoBase64,
        lat: formData.get('lat'),
        lon: formData.get('lon'),
        createdAt: new Date().toISOString(),
        isOffline: true,
      };

      const queueData = {
        description: formData.get('description'),
        photo: photoBase64,
        lat: formData.get('lat'),
        lon: formData.get('lon'),
        timestamp: Date.now(),
        tempId: formData.get('id'),
      };

      const db = await initDB();
      const tx = db.transaction([STORE_NAME, QUEUE_STORE_NAME], 'readwrite');
      const storiesStore = tx.objectStore(STORE_NAME);
      const queueStore = tx.objectStore(QUEUE_STORE_NAME);

      console.log('Menyimpan story offline:', storyData);
      const savePromise = storiesStore.put(storyData);

      console.log('Mengantri story:', queueData);
      const queueKey = await queueStore.add(queueData); // Simpan kunci auto-increment
      queueData.id = queueKey; // Tambahkan kunci ke queueData

      await Promise.all([savePromise]);
      await tx.done;
      console.log('Story disimpan dengan queue ID:', queueKey);
      return queueKey;
    } catch (error) {
      console.error('Gagal menyimpan dan mengantri story:', error);
      throw error;
    }
  },

  async getQueuedStories() {
    try {
      const db = await initDB();
      const stories = await db.getAll(QUEUE_STORE_NAME);
      console.log('Mengambil story antrian:', stories.length);
      return stories.map((story) => ({
        ...story,
        id: story.id || story.key, // Gunakan key dari IndexedDB jika id tidak ada
      }));
    } catch (error) {
      console.error('Gagal mengambil story antrian:', error);
      return [];
    }
  },

  async syncQueuedStories() {
    try {
      const queuedStories = await this.getQueuedStories();
      if (!navigator.onLine || queuedStories.length === 0) {
        console.log('Tidak ada story untuk disinkronkan atau offline');
        return false;
      }

      const db = await initDB();
      const tx = db.transaction([QUEUE_STORE_NAME, STORE_NAME], 'readwrite');
      const storiesStore = tx.objectStore(STORE_NAME);
      const queueStore = tx.objectStore(QUEUE_STORE_NAME);

      const syncedIds = new Set();

      for (const story of queuedStories) {
        if (syncedIds.has(story.id)) {
          console.log('Melewati story yang sudah disinkronkan:', story.id);
          continue;
        }

        const existingStory = await storiesStore.get(story.tempId);
        if (!existingStory) {
          console.log('Story sudah dihapus dari stories, menghapus dari queue:', story.id);
          await queueStore.delete(story.id);
          continue;
        }

        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('photo', this.base64ToBlob(story.photo));
        if (story.lat && story.lon) {
          formData.append('lat', story.lat);
          formData.append('lon', story.lon);
        }

        console.log('Menyinkronkan story:', story.id);
        const response = await addStory(formData);

        await storiesStore.put({
          ...response.story,
          isOffline: false,
        });

        await queueStore.delete(story.id);
        syncedIds.add(story.id);

        if (story.tempId) {
          await storiesStore.delete(story.tempId);
          console.log('Menghapus story offline:', story.tempId);
        }
      }

      await tx.done;
      console.log('Sinkronisasi story selesai, ID yang disinkronkan:', Array.from(syncedIds));
      return true;
    } catch (error) {
      console.error('Gagal menyinkronkan story:', error);
      return false;
    }
  },

  async deleteStory(id) {
    try {
      const db = await initDB();
      const tx = db.transaction([STORE_NAME, QUEUE_STORE_NAME], 'readwrite');
      const storiesStore = tx.objectStore(STORE_NAME);
      const queueStore = tx.objectStore(QUEUE_STORE_NAME);

      // Hapus dari stories
      await storiesStore.delete(id);
      console.log('Menghapus story dari stories:', id);

      // Cari dan hapus entri di story-queue dengan tempId yang sama
      const queuedStories = await queueStore.getAll();
      const deletePromises = [];
      for (const queuedStory of queuedStories) {
        if (queuedStory.tempId === id && queuedStory.id !== undefined) {
          deletePromises.push(queueStore.delete(queuedStory.id));
          console.log('Menghapus story dari story-queue:', queuedStory.id);
        }
      }

      await Promise.all(deletePromises);
      await tx.done;
      console.log('Penghapusan story selesai untuk ID:', id);
    } catch (error) {
      console.error('Gagal menghapus story:', error);
      throw error;
    }
  },

  async clearAllStories() {
    try {
      const db = await initDB();
      const tx = db.transaction([STORE_NAME, QUEUE_STORE_NAME], 'readwrite');
      await tx.objectStore(STORE_NAME).clear();
      await tx.objectStore(QUEUE_STORE_NAME).clear();
      console.log('Menghapus semua story dan antrian');
      await tx.done;
    } catch (error) {
      console.error('Gagal menghapus semua story:', error);
      throw error;
    }
  },

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  base64ToBlob(base64) {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  },
};

export default StoryModel;