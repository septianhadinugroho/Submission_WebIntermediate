import StoryCard from '../components/StoryCard.js';

class OfflineStoriesView {
  constructor({ onDelete, onClearAll }) {
    this.onDelete = onDelete;
    this.onClearAll = onClearAll;
    this.section = document.createElement('section');
    this.section.className = 'offline-stories-page';
    this.section.innerHTML = `
      <h1>Offline Stories</h1>
      <button id="clear-all-btn" class="btn btn-danger">Clear All Stories</button>
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
      container.innerHTML = '<p>No offline stories found. Please load stories while online.</p>';
      return;
    }

    stories.forEach(story => {
      const card = new StoryCard(story).render();
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger btn-sm';
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.marginTop = '10px';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Mencegah klik card memicu navigasi
        this.onDelete(story.id);
      });
      card.appendChild(deleteBtn);
      container.appendChild(card);
    });

    const clearAllBtn = this.section.querySelector('#clear-all-btn');
    // Hapus listener lama untuk mencegah duplikasi
    clearAllBtn.removeEventListener('click', this.onClearAll);
    clearAllBtn.addEventListener('click', this.onClearAll);
  }

  showError(message) {
    const container = this.section.querySelector('#stories-container');
    container.innerHTML = `<p class="error">${message}</p>`;
  }
}

export default OfflineStoriesView;