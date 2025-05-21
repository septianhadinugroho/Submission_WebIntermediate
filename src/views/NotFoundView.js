class NotFoundView {
  constructor() {
    this.section = document.createElement('section');
    this.section.className = 'not-found-page';
    this.section.innerHTML = `
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="#/" class="btn btn-primary">Back to Home</a>
    `;
  }

  getElement() {
    return this.section;
  }
}

export default NotFoundView;