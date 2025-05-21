import { login } from '../services/auth.js';

const LoginModel = {
  async login(email, password) {
    return await login(email, password);
  }
};

export default LoginModel