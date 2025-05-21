class LoginView {
    constructor() {
      this.section = document.createElement('section');
      this.section.className = 'auth-container slide-left';
      this.section.innerHTML = `
        <h2>Login</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" class="form-control" required autocomplete="username">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" class="form-control" required minlength="8" autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-primary">Login</button>
        </form>
        <div class="auth-switch">
          Don't have an account? <a href="#/register">Register here</a>
        </div>
      `;
    }
  
    getElement() {
      return this.section;
    }
  
    getFormData() {
      return {
        email: this.section.querySelector('#email').value,
        password: this.section.querySelector('#password').value
      };
    }
  
    onSubmit(handler) {
      const form = this.section.querySelector('#login-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handler();
      });
    }
  }
  
  export default LoginView