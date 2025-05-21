import Router from './utils/router.js';
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import { checkAuth } from './services/auth.js';
import { initViewTransitions } from './utils/viewTransition.js';
import { showToast } from './utils/helpers.js';
import StoriesPresenter from './presenters/StoriesPresenter.js';
import LoginPresenter from './presenters/LoginPresenter.js';
import RegisterPresenter from './presenters/RegisterPresenter.js';
import HomePresenter from './presenters/HomePresenter.js';
import AddStoryPresenter from './presenters/AddStoryPresenter.js';
import StoryDetailPresenter from './presenters/StoryDetailPresenter.js';
import OfflineStoriesPresenter from './presenters/OfflineStoriesPresenter.js';
import NotFoundPresenter from './presenters/NotFoundPresenter.js';

class App {
  constructor() {
    this.router = new Router();
    this.header = new Header();
    this.footer = new Footer();
    this.currentPage = null;
    this.isAuthenticated = false;
  }

  async init() {
    try {
      if (document.readyState !== 'complete') {
        await new Promise((resolve) => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve);
          }
        });
      }

      this.isAuthenticated = await checkAuth();
      this.setupRoutes();
      await this.renderLayout();
      
      window.Router = Router;
      initViewTransitions();
      
      await this.renderInitialPage();
    } catch (error) {
      console.error('App initialization failed:', error);
      showToast('Failed to initialize application', 'error');
      document.body.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
          <h1>Dicoding Story App</h1>
          <p>Application failed to load. Please refresh the page.</p>
          <button onclick="window.location.reload()">Refresh</button>
        </div>
      `;
    }
  }

  async renderLayout() {
    const headerElement = await this.header.render();
    const footerElement = await this.footer.render();
    const mainElement = document.createElement('main');
    mainElement.id = 'main-content';
    mainElement.setAttribute('tabindex', '-1');
    mainElement.setAttribute('role', 'main');

    const skipLink = document.createElement('a');
    skipLink.href = '#';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to content';

    skipLink.addEventListener('click', function (event) {
      event.preventDefault();
      skipLink.blur();

      mainElement.focus();
      mainElement.scrollIntoView({ behavior: 'smooth' });
    });

    document.body.innerHTML = '';
    document.body.appendChild(skipLink);
    document.body.appendChild(headerElement);
    document.body.appendChild(mainElement);
    document.body.appendChild(footerElement);

    document.body.classList.add('fade-in');

    await this.header.afterRender();
  }

  async renderInitialPage() {
    const hash = window.location.hash || '#/';
    const route = Object.keys(this.router.routes).find((r) => {
      if (r.includes(':')) {
        const basePath = r.split(':')[0];
        return hash.startsWith(basePath);
      }
      return hash === r;
    });

    if (route) {
      if (route.includes(':')) {
        const param = hash.split('/').pop();
        await this.router.routes[route](param);
      } else {
        await this.router.routes[route]();
      }
    } else {
      await this.router.routes['#/not-found']();
    }
  }

  setupRoutes() {
    this.router.addRoute('#/', async () => {
      await this.#renderPresenter(new HomePresenter());
    });

    this.router.addRoute('#/stories', async () => {
      await this.#renderPresenter(new StoriesPresenter());
    });

    this.router.addRoute('#/stories/add', async () => {
      if (this.isAuthenticated) {
        await this.#renderPresenter(new AddStoryPresenter());
      } else {
        this.router.navigate('#/login');
      }
    });

    this.router.addRoute('#/stories/:id', async (id) => {
      await this.#renderPresenter(new StoryDetailPresenter(id));
    });

    this.router.addRoute('#/login', async () => {
      await this.#renderPresenter(new LoginPresenter());
    });

    this.router.addRoute('#/register', async () => {
      await this.#renderPresenter(new RegisterPresenter());
    });

    this.router.addRoute('#/offline-stories', async () => {
      await this.#renderPresenter(new OfflineStoriesPresenter());
    });

    this.router.addRoute('#/not-found', async () => {
      await this.#renderPresenter(new NotFoundPresenter());
    });
  }

  async #renderPresenter(presenter) {
    const updateDOM = async () => {
      if (this.currentPage && typeof this.currentPage.destroy === 'function') {
        await this.currentPage.destroy();
      }

      this.currentPage = presenter;
      const page = await presenter.init();
      const main = document.querySelector('main');

      let transitionClass = 'fade-in';
      
      if (presenter instanceof StoryDetailPresenter) {
        transitionClass = 'slide-left';
      } else if (presenter instanceof HomePresenter) {
        transitionClass = 'zoom';
      } else if (presenter instanceof LoginPresenter || presenter instanceof RegisterPresenter) {
        transitionClass = 'slide-right';
      } else if (presenter instanceof NotFoundPresenter) {
        transitionClass = 'fade-in';
      }
      
      document.body.className = transitionClass;

      main.innerHTML = '';
      main.appendChild(page);
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => updateDOM());
    } else {
      await updateDOM();
    }
  }
}

export default App;