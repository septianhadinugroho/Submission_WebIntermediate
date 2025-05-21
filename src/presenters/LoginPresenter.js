import LoginModel from '../models/LoginModel.js';
import LoginView from '../views/LoginView.js';
import { showToast } from '../utils/helpers.js';
import { navigateTo } from '../utils/router.js';

class LoginPresenter {
  constructor() {
    this.view = new LoginView();
  }

  async init() {
    this.view.onSubmit(() => this.handleLogin());
    return this.view.getElement();
  }

  async handleLogin() {
    const { email, password } = this.view.getFormData();
    
    try {
      const response = await LoginModel.login(email, password);

      localStorage.setItem('dicoding_story_token', response.loginResult.token);
      localStorage.setItem('dicoding_story_user', JSON.stringify({
        userId: response.loginResult.userId,
        name: response.loginResult.name
      }));

      showToast('Login successful!', 'success');
      navigateTo('#/');
      setTimeout(() => window.location.reload(), 200);
    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed. Please check your credentials.', 'error');
    }
  }
}

export default LoginPresenter