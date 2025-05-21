import StoryModel from '../models/StoryModel.js';
import OfflineStoriesView from '../views/OfflineStoriesView.js';
import { showToast } from '../utils/helpers.js';

class OfflineStoriesPresenter {
  constructor() {
    this.view = new OfflineStoriesView({
      onDelete: this.handleDelete.bind(this),
      onClearAll: this.handleClearAll.bind(this),
    });
    this.isDeleting = new Set(); // Track ongoing deletions
  }

  async init() {
    try {
      const stories = await StoryModel.getAllStoriesOffline(); // Gunakan getAllStoriesOffline
      this.view.showStories(stories);
      if (stories.length === 0 && !navigator.onLine) {
        showToast('Tidak ada story offline tersedia.', 'info');
      }
    } catch (error) {
      console.error('Gagal memuat story offline:', error);
      this.view.showError('Gagal memuat story offline.');
      showToast('Error memuat story offline.', 'error');
    }
    return this.view.getElement();
  }

  async handleDelete(id) {
    if (this.isDeleting.has(id)) {
      console.log('Penghapusan sedang berlangsung untuk ID:', id);
      return;
    }

    this.isDeleting.add(id);
    try {
      await StoryModel.deleteStory(id);
      console.log('Story berhasil dihapus:', id);
      showToast('Story berhasil dihapus dari penyimpanan offline', 'success');
      const stories = await StoryModel.getAllStoriesOffline();
      this.view.showStories(stories);
    } catch (error) {
      console.error('Gagal menghapus story:', error);
      showToast('Gagal menghapus story', 'error');
    } finally {
      this.isDeleting.delete(id);
    }
  }

  async handleClearAll() {
    try {
      await StoryModel.clearAllStories();
      console.log('Semua story offline dihapus');
      showToast('Semua story offline dihapus', 'success');
      this.view.showStories([]);
    } catch (error) {
      console.error('Gagal menghapus semua story:', error);
      showToast('Gagal menghapus story', 'error');
    }
  }
}

export default OfflineStoriesPresenter;