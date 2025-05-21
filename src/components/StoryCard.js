export default class StoryCard {
  constructor(story) {
    this.story = story;
  }

  render() {
    const card = document.createElement('article');
    card.className = 'story-card';
    card.style.viewTransitionName = `story-${this.story.id}`;
    card.innerHTML = `
      <a href="#/stories/${this.story.id}" class="story-link">
        <img src="${this.story.photoUrl || '/placeholder.png'}" alt="${this.story.description}" loading="lazy">
        <div class="story-content">
          <h3>${this.story.name}</h3>
          <p>${this.story.description.substring(0, 100)}${this.story.description.length > 100 ? '...' : ''}</p>
          <div class="story-meta">
            <span><i class="fas fa-calendar-alt"></i> ${new Date(this.story.createdAt).toLocaleDateString()}</span>
            ${this.story.lat && this.story.lon 
              ? `<span><i class="fas fa-map-marker-alt"></i> Location</span>` 
              : ''}
            ${this.story.isOffline ? `<span>(Offline - Pending Sync)</span>` : ''}
          </div>
        </div>
      </a>
    `;
    return card;
  }
}