import HomeView from '../views/HomeView.js';

class HomePresenter {
  constructor() {
    this.view = new HomeView();
  }

  async init() {
    return await this.view.render();
  }
  
  destroy() {
    if (this.view.mapComponent) {
      this.view.mapComponent.destroy();
    }
  }
}

export default HomePresenter;