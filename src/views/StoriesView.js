import StoryCard from '../components/StoryCard.js';
import { navigateTo } from '../utils/router.js';

class StoriesView {
  constructor({ onRetry, onDelete } = {}) {
    this.onRetry = onRetry;
    this.onDelete = onDelete;
    this.section = document.createElement('section');
    this.section.className = 'stories-page';
    this.section.innerHTML = `
      <h1>${window.location.hash === '#/offline-stories' ? 'Offline Stories' : 'Stories'}</h1>
      <div class="stories-grid" id="stories-container"></div>
    `;
  }

  getElement() {
    return this.section;
  }

  showStories(stories) {
    const container = this.section.querySelector('#stories-container');
    container.innerHTML = '';
    if (stories.length === 0) {
      container.innerHTML = '<p>No stories found.</p>';
      return;
    }

    stories.forEach((story) => {
      const card = new StoryCard(story).render();
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
          this.onDelete?.(story.id);
        } else if (!e.target.closest('.story-link')) {
          navigateTo(`#/stories/${story.id}`);
        }
      });
      container.appendChild(card);
    });
  }

  showStoryDetail(story) {
    const container = this.section.querySelector('#stories-container');
    container.innerHTML = `
      <div class="story-detail">
        <img src="${story.photoUrl || '/placeholder.png'}" alt="${story.description}" />
        <h2>${story.name}</h2>
        <p>${story.description}</p>
        <p><i class="fas fa-calendar-alt"></i> ${new Date(story.createdAt).toLocaleDateString()}</p>
        ${story.lat && story.lon ? `<p><i class="fas fa-map-marker-alt"></i> Location: ${story.lat}, ${story.lon}</p>` : ''}
        ${story.isOffline ? `<p>(Offline - Pending Sync)</p>` : ''}
        <button class="delete-btn btn btn-danger">Delete</button>
        <a href="#/stories" class="btn btn-primary">Back to Stories</a>
      </div>
    `;
    container.querySelector('.delete-btn')?.addEventListener('click', () => this.onDelete?.(story.id));
  }

  showError(message) {
    const container = this.section.querySelector('#stories-container');
    container.innerHTML = `
      <p class="error">${message}</p>
      <button id="retry-btn" class="btn btn-primary">Retry</button>
    `;
    const retryBtn = container.querySelector('#retry-btn');
    if (this.onRetry) {
      retryBtn.addEventListener('click', this.onRetry);
    }
  }

  showLoginPrompt() {
    const container = this.section.querySelector('#stories-container');
    container.innerHTML = `
      <p>Please log in to view stories. <a href="#/login" class="btn btn-primary">Login</a></p>
    `;
  }
}

export default StoriesView;