import MapComponent from '../components/MapComponent.js';
import { getStories } from '../services/api.js';

export default class HomeView {
  constructor() {
    this.mapComponent = null;
    this.stories = [];
  }

  async fetchStories() {
    try {
      this.stories = await getStories();
      return this.stories;
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      return [];
    }
  }

  async renderMap(container) {
    const mapContainer = document.createElement('div');
    mapContainer.id = 'home-map';
    container.appendChild(mapContainer);

    this.mapComponent = new MapComponent('home-map', {
      withLayerControl: true,
      initialZoom: 5,
      initialLocation: [-2.5489, 118.0149]
    }).init();

    if (this.stories.length > 0) {
      this.stories.forEach(story => {
        if (story.lat && story.lon) {
          this.mapComponent.addMarker(
            story.lat,
            story.lon,
            `<strong>${story.name}</strong><p>${story.description.substring(0, 100)}...</p>
             <a href="#/stories/${story.id}" class="map-link">View Story</a>`
          );
        }
      });
    }
  }

  async render() {
    await this.fetchStories();
    
    const section = document.createElement('section');
    section.className = 'home-container';
    
    const heroSection = document.createElement('div');
    heroSection.className = 'hero slide-left';
    heroSection.innerHTML = `
      <h1>Share Your Dicoding Story</h1>
      <p>Connect with fellow Dicoding students and share your learning journey, projects, and experiences in the world of programming and technology.</p>
      <div class="cta-buttons">
        <a href="#/stories" class="btn btn-primary">Browse Stories</a>
        <a href="#/stories/add" class="btn btn-outline">Share Your Story</a>
      </div>
    `;
    section.appendChild(heroSection);
    
    const mapSection = document.createElement('div');
    mapSection.className = 'map-section slide-right';
    mapSection.innerHTML = `
      <h2>Stories Around the World</h2>
      <p>Discover stories from Dicoding students across the globe.</p>
    `;
    section.appendChild(mapSection);
    
    setTimeout(() => this.renderMap(mapSection), 100);
    
    return section;
  }
}