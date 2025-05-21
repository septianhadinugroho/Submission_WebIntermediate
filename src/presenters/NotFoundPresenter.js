import NotFoundView from '../views/NotFoundView.js';

class NotFoundPresenter {
  constructor() {
    this.view = new NotFoundView();
  }

  async init() {
    return this.view.getElement();
  }
}

export default NotFoundPresenter;