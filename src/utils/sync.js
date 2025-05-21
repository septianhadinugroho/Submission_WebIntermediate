import StoryModel from '../models/StoryModel.js';
import { showToast } from './helpers.js';

async function syncStories() {
  try {
    console.log('Attempting to sync queued stories');
    const synced = await StoryModel.syncQueuedStories();
    if (synced) {
      showToast('Queued stories synced successfully!', 'success');
    } else {
      console.log('No stories synced (offline or no queued stories)');
    }
  } catch (error) {
    console.error('Sync failed:', error);
    showToast('Failed to sync stories', 'error');
  }
}

// Initialize sync listeners
function initSync() {
  let isSyncing = false;

  // Trigger sync on online event
  window.addEventListener('online', async () => {
    if (!isSyncing) {
      isSyncing = true;
      console.log('Device online, triggering sync');
      await syncStories();
      isSyncing = false;
    } else {
      console.log('Sync already in progress, skipping');
    }
  });

  // Trigger sync on page load if online
  document.addEventListener('DOMContentLoaded', async () => {
    if (navigator.onLine && !isSyncing) {
      isSyncing = true;
      console.log('Page loaded and online, triggering sync');
      await syncStories();
      isSyncing = false;
    }
  });
}

export { initSync, syncStories };