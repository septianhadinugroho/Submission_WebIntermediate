import { navigateTo } from '../utils/router.js';
import { logout } from '../services/auth.js';
import { showToast } from '../utils/helpers.js';
import { subscribeToNotifications, checkNotificationPermission } from '../services/notification.js';

class Header {
  constructor() {
    this.isAuthenticated = false;
    this.isSubscribed = false; // Initialize as false, will check actual status in afterRender
    this.handleLogout = this.handleLogout.bind(this);
    this.handleSubscribe = this.handleSubscribe.bind(this);
  }

  async render() {
    const token = localStorage.getItem('dicoding_story_token');
    this.isAuthenticated = !!token;

    const header = document.createElement('header');
    header.innerHTML = `
      <nav>
        <a href="#/" class="logo">
          <span>Dicoding Story</span>
        </a>
        <!-- Hamburger Button -->
        <button id="hamburger" class="hamburger" aria-label="Toggle navigation">
          <i class="fas fa-bars"></i>
        </button>
        <ul class="nav-links">
          <li><a href="#/">Home</a></li>
          <li><a href="#/stories">Stories</a></li>
          <li><a href="#/offline-stories">Offline Stories</a></li>
          ${this.isAuthenticated ? '<li><a href="#/stories/add">Add Story</a></li>' : ''}
          <li>
            ${this.isAuthenticated 
              ? `
                <div class="auth-buttons">
                  <button type="button" class="btn btn-primary btn-sm" id="notification-btn">
                    ${this.isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
                  </button>
                  <button type="button" class="btn btn-danger btn-sm" id="logout-btn">Logout</button>
                </div>
              ` 
              : `
                <div class="auth-buttons">
                  <a href="#/login" class="btn btn-outline btn-sm">Login</a>
                  <a href="#/register" class="btn btn-primary btn-sm">Register</a>
                </div>
              `}
          </li>
        </ul>
      </nav>
    `;
    return header;
  }

  async afterRender() {
    // Check notification permission and subscription status
    if (this.isAuthenticated) {
      await this.checkSubscriptionStatus();
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout);
    }

    const notificationBtn = document.getElementById('notification-btn');
    if (notificationBtn) {
      console.log('Notification button found, attaching event listener');
      notificationBtn.addEventListener('click', this.handleSubscribe);
      // Update button state based on actual subscription status
      notificationBtn.textContent = this.isSubscribed ? 'Notifications Enabled' : 'Enable Notifications';
      notificationBtn.disabled = this.isSubscribed;
    } else {
      console.warn('Notification button not found');
    }

    // Handle Hamburger Toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
      });
    }
  }

  async checkSubscriptionStatus() {
    try {
      // Check if notifications are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        this.isSubscribed = false;
        return;
      }

      // Check permission and subscription
      const hasPermission = await checkNotificationPermission();
      if (!hasPermission) {
        this.isSubscribed = false;
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      this.isSubscribed = !!subscription;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      this.isSubscribed = false;
    }
  }

  async handleLogout() {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      
      localStorage.removeItem('dicoding_story_token');
      localStorage.removeItem('dicoding_story_user');
      
      navigateTo('#/');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('Failed to logout', 'error');
    }
  }

  async handleSubscribe() {
    try {
      console.log('Notification button clicked');
      const success = await subscribeToNotifications();
      if (success) {
        this.isSubscribed = true;
        const notificationBtn = document.getElementById('notification-btn');
        if (notificationBtn) {
          notificationBtn.textContent = 'Notifications Enabled';
          notificationBtn.disabled = true;
        }
        showToast('Notifications enabled!', 'success');
      } else {
        showToast('Failed to enable notifications', 'error');
      }
    } catch (error) {
      console.error('Notification subscription failed:', error);
      showToast('Failed to enable notifications: ' + error.message, 'error');
    }
  }
}

export default Header;