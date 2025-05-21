import App from './App.js';
import { initSync } from './utils/sync.js';
import './styles/variables.css';
import './styles/main.css';
import './styles/transitions.css';

async function initializeApp() {
  try {
    const app = new App();
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve));
    }
    await app.init();
    initSync(); // Initialize sync for queued stories
  } catch (error) {
    console.error('Application failed to start:', error);
    const fallback = document.createElement('div');
    fallback.style.padding = '2rem';
    fallback.style.textAlign = 'center';
    fallback.innerHTML = `
      <h1>Application Error</h1>
      <p>Failed to initialize the application. Please refresh the page.</p>
      <button onclick="window.location.reload()">Refresh</button>
    `;
    document.body.innerHTML = '';
    document.body.appendChild(fallback);
  }
}

initializeApp();