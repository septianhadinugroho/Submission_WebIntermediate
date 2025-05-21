import StoryModel from '../models/StoryModel.js';
import StoriesView from '../views/StoriesView.js';
import { checkAuth } from '../services/auth.js';
import { showToast } from '../utils/helpers.js';

class StoriesPresenter {
  constructor() {
    this.view = new StoriesView({
      onRetry: this.init.bind(this),
      onDelete: this.deleteStory.bind(this),
    });
  }

  async init() {
    try {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        this.view.showLoginPrompt();
        return this.view.getElement();
      }

      const hash = window.location.hash;
      if (hash.startsWith('#/stories/') && hash !== '#/stories') {
        // Handle story detail view
        const id = hash.split('/').pop();
        const story = await StoryModel.fetchStoryDetail(id);
        this.view.showStoryDetail(story);
        if (story.isOffline) {
          showToast('Showing offline story', 'info');
        }
      } else if (hash === '#/offline-stories') {
        // Handle offline stories list
        const stories = await StoryModel.getOfflineStories();
        if (stories.length === 0) {
          this.view.showError('No stories available offline.');
        } else {
          this.view.showStories(stories);
          showToast('Showing offline stories', 'info');
        }
      } else {
        // Handle main stories list
        const stories = await StoryModel.fetchAllStories();
        if (stories.length === 0 && !navigator.onLine) {
          this.view.showError('No stories available offline.');
        } else {
          this.view.showStories(stories);
          if (!navigator.onLine) {
            showToast('Showing offline stories', 'info');
          }
        }
      }
    } catch (err) {
      console.error('Presenter error:', err);
      this.view.showError('Failed to load stories. Please try again later.');
    }

    return this.view.getElement();
  }

  async deleteStory(id) {
    try {
      await StoryModel.deleteStory(id);
      showToast('Story deleted successfully', 'success');
      this.init(); // Refresh the list
    } catch (error) {
      console.error('Error deleting story:', error);
      showToast('Failed to delete story', 'error');
    }
  }
}

export default StoriesPresenter;