import { register } from '../services/auth.js';
import { showToast } from '../utils/helpers.js';
import { navigateTo } from '../utils/router.js';
import RegisterView from '../views/RegisterView.js';

export default class RegisterPresenter {
  constructor() {
    this.view = new RegisterView();
  }

  async init() {
    const element = this.view.render();
    setTimeout(() => {
      this.view.bindRegisterHandler(this.handleRegister.bind(this));
    }, 0);
    return element;
  }

  async handleRegister({ name, email, password }) {
    try {
      await register(name, email, password);
      showToast('Registration successful! Please login.', 'success');
      navigateTo('#/login');
    } catch (error) {
      console.error('Registration error:', error);
      showToast('Registration failed. Email may already be taken.', 'error');
    }
  }
}