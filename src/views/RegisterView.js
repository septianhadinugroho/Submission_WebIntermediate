export default class RegisterView {
    constructor() {}
  
    render() {
      const section = document.createElement('section');
      section.className = 'auth-container slide-left';
      section.innerHTML = `
        <h2>Register</h2>
        <form id="register-form">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" class="form-control" required minlength="8">
          </div>
          <button type="submit" class="btn btn-primary">Register</button>
        </form>
        <div class="auth-switch">
          Already have an account? <a href="#/login">Login here</a>
        </div>
      `;
      return section;
    }
  
    bindRegisterHandler(handler) {
      const form = document.getElementById('register-form');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await handler({ name, email, password });
      });
    }
  }