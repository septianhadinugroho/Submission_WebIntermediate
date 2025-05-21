import { getAuthToken } from './auth.js';
import { showToast } from '../utils/helpers.js';

const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request error (${url}):`, error);
    if (navigator.onLine) {
      showToast(error.message || 'Something went wrong', 'error');
    }
    throw error;
  }
}

export async function getStories() {
  try {
    const response = await fetchWithAuth('/stories?size=100');
    return response.listStory || [];
  } catch (error) {
    console.error('Fetch stories error:', error);
    throw error;
  }
}

export async function getStoryDetail(storyId) {
  try {
    const response = await fetchWithAuth(`/stories/${storyId}`);
    return response.story;
  } catch (error) {
    console.error('Fetch story detail error:', error);
    throw error;
  }
}

export async function addStory(formData) {
  const token = getAuthToken();
  const url = token ? '/stories' : '/stories/guest';
  
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to add story: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Add story error:', error);
    if (navigator.onLine) {
      showToast(error.message || 'Failed to add story', 'error');
    }
    throw error;
  }
}