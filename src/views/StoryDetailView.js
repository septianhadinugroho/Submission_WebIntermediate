class StoryDetailView {
  constructor() {
    this.section = document.createElement('section');
    this.section.className = 'story-detail-container slide-right';
  }

  createContainer() {
    return this.section;
  }

  showLoading() {
    this.section.innerHTML = `
      <div class="story-detail">
        <div id="story-content">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i> Loading story...
          </div>
        </div>
      </div>
    `;
  }

  showError() {
    const storyContent = this.section.querySelector('#story-content');
    if (storyContent) {
      storyContent.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i> Failed to load story. Please try again later.
        </div>
      `;
    }
  }

  renderStory(story) {
    this.section.innerHTML = `
      <div class="story-detail">
        <img src="${story.photoUrl}" alt="${story.description}" loading="lazy">
        <div class="story-detail-content">
          <h2>${story.name}</h2>
          <div class="meta">
            <span><i class="fas fa-calendar-alt"></i> ${new Date(story.createdAt).toLocaleDateString()}</span>
            ${story.lat && story.lon ? '<span><i class="fas fa-map-marker-alt"></i> Location</span>' : ''}
          </div>
          <p>${story.description}</p>
          ${story.lat && story.lon ? '<div class="map-container" id="map-container"></div>' : ''}
        </div>
      </div>
    `;
  }
}

export default StoryDetailView;