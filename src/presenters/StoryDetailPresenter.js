import StoryModel from '../models/StoryModel.js';
import StoryDetailView from '../views/StoryDetailView.js';
import MapComponent from '../components/MapComponent.js';
import { showToast } from '../utils/helpers.js';

class StoryDetailPresenter {
  constructor(storyId) {
    this.storyId = storyId;
    this.map = null;
    this.view = new StoryDetailView({
      onDelete: this.deleteStory.bind(this),
    });
  }

  async init() {
    const section = this.view.createContainer();
    this.view.showLoading();

    try {
      const story = await StoryModel.fetchStoryDetail(this.storyId);
      this.view.renderStory(story);

      if (story.isOffline) {
        showToast('Showing offline story', 'info');
      }

      if (story.lat && story.lon) {
        requestAnimationFrame(() => {
          this.map = new MapComponent('map-container', {
            initialLocation: [story.lat, story.lon],
            initialZoom: 13,
            clickable: false, // Detail map is view-only
          });
          this.map.init();
          this.map.addMarker(
            story.lat,
            story.lon,
            `<b>${story.name}</b><br>${story.description.substring(0, 50)}...`
          );
        });
      }
    } catch (error) {
      console.error('Failed to load story:', error);
      this.view.showError('Failed to load story details. Please try again.');
    }

    return section;
  }

  async deleteStory() {
    try {
      await StoryModel.deleteStory(this.storyId);
      showToast('Story deleted successfully', 'success');
      window.history.back(); // Navigate back to stories list
    } catch (error) {
      console.error('Error deleting story:', error);
      showToast('Failed to delete story', 'error');
    }
  }

  destroy() {
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
  }
}

export default StoryDetailPresenter;