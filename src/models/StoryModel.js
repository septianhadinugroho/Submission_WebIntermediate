import { getStories, getStoryDetail, addStory } from '../services/api.js';
import { openDB } from 'idb';

const DB_NAME = 'story-app';
const STORE_NAME = 'stories';
const QUEUE_STORE_NAME = 'story-queue';
const IMAGE_STORE_NAME = 'cached-images';

async function initDB() {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        db.createObjectStore(QUEUE_STORE_NAME, { autoIncrement: true });
      }
      // Add image store for offline image caching
      if (oldVersion < 2 && !db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        db.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'url' });
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
      const tx = db.transaction([STORE_NAME, IMAGE_STORE_NAME], 'readwrite');
      const storiesStore = tx.objectStore(STORE_NAME);
      const imageStore = tx.objectStore(IMAGE_STORE_NAME);
      
      // Save stories and cache their images
      await Promise.all(stories.map(async (story) => {
        await storiesStore.put({ ...story, isOffline: false });
        
        // Cache image for offline use
        if (story.photoUrl && !story.photoUrl.startsWith('data:')) {
          try {
            await this.cacheImageForOffline(story.photoUrl, imageStore);
          } catch (error) {
            console.warn('Failed to cache image for story:', story.id, error);
          }
        }
      }));
      
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
      const tx = db.transaction([STORE_NAME, IMAGE_STORE_NAME], 'readwrite');
      const storiesStore = tx.objectStore(STORE_NAME);
      const imageStore = tx.objectStore(IMAGE_STORE_NAME);
      
      await storiesStore.put({ ...story, isOffline: false });
      
      // Cache image for offline use
      if (story.photoUrl && !story.photoUrl.startsWith('data:')) {
        try {
          await this.cacheImageForOffline(story.photoUrl, imageStore);
        } catch (error) {
          console.warn('Failed to cache image for story detail:', story.id, error);
        }
      }
      
      await tx.done;
      return story;
    } catch (error) {
      console.error('Gagal mengambil detail story:', error);
      const db = await initDB();
      const story = await db.get(STORE_NAME, id);
      if (story) {
        console.log('Mengambil story offline:', id);
        
        // Check if we have cached image data
        const cachedImage = await db.get(IMAGE_STORE_NAME, story.photoUrl);
        if (cachedImage && cachedImage.data) {
          story.photoUrl = cachedImage.data;
        }
        
        return story;
      }
      throw new Error('Story tidak ditemukan di penyimpanan offline');
    }
  },

  async getAllStoriesOffline() {
    try {
      const db = await initDB();
      const tx = db.transaction([STORE_NAME, IMAGE_STORE_NAME], 'readonly');
      const storiesStore = tx.objectStore(STORE_NAME);
      const imageStore = tx.objectStore(IMAGE_STORE_NAME);
      
      const stories = await storiesStore.getAll();
      
      // Replace online image URLs with cached base64 data when offline
      if (!navigator.onLine) {
        for (const story of stories) {
          if (story.photoUrl && !story.photoUrl.startsWith('data:')) {
            const cachedImage = await imageStore.get(story.photoUrl);
            if (cachedImage && cachedImage.data) {
              story.photoUrl = cachedImage.data;
            } else {
              story.photoUrl = '/placeholder.png';
            }
          }
        }
      }
      
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

  async cacheImageForOffline(imageUrl, imageStore) {
    if (!imageUrl || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
      return;
    }

    try {
      // Check if already cached
      const existing = await imageStore.get(imageUrl);
      if (existing) {
        return;
      }

      // Fetch and convert to base64
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);

      // Store in IndexedDB
      await imageStore.put({
        url: imageUrl,
        data: base64,
        timestamp: Date.now()
      });

      console.log('Image cached for offline use:', imageUrl);
    } catch (error) {
      console.warn('Failed to cache image:', imageUrl, error);
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
      const queueKey = await queueStore.add(queueData);
      queueData.id = queueKey;

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
        id: story.id || story.key,
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

      await storiesStore.delete(id);
      console.log('Menghapus story dari stories:', id);

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
      const tx = db.transaction([STORE_NAME, QUEUE_STORE_NAME, IMAGE_STORE_NAME], 'readwrite');
      await tx.objectStore(STORE_NAME).clear();
      await tx.objectStore(QUEUE_STORE_NAME).clear();
      await tx.objectStore(IMAGE_STORE_NAME).clear();
      console.log('Menghapus semua story, antrian, dan cache gambar');
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