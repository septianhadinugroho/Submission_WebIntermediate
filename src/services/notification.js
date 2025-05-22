import { getAuthToken } from './auth.js';
import { showToast } from '../utils/helpers.js';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

export async function checkNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }
  
  switch (Notification.permission) {
    case 'granted':
      return true;
    case 'denied':
      console.warn('Notification permission denied');
      return false;
    default: // 'default' or undefined
      return false;
  }
}

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return true;
    }
    showToast('Notifications blocked', 'warning');
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export async function subscribeToNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser');
    showToast('Push notifications not supported', 'warning');
    return false;
  }

  try {
    // First check if we already have permission
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const success = await saveSubscription(subscription);
    if (success) {
      showToast('Notifications enabled', 'success');
    }
    return success;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    showToast('Failed to enable notifications', 'error');
    return false;
  }
}

export async function triggerNotification(title, body) {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return false;
  }

  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      console.warn('No notification permission granted');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/logo.png',
      badge: '/favicon.png',
    });
    return true;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return false;
  }
}

async function saveSubscription(subscription) {
  const token = getAuthToken();
  if (!token) {
    console.warn('No auth token found');
    return false;
  }

  try {
    const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey('p256dh')
            ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh'))))
            : null,
          auth: subscription.getKey('auth')
            ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
            : null,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save subscription');
    }

    return true;
  } catch (error) {
    console.error('Error saving subscription:', error);
    return false;
  }
}

function urlBase64ToUint8Array(base64String) {
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (error) {
    console.error('Error converting VAPID key:', error);
    throw error;
  }
}