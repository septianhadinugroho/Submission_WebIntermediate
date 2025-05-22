import AddStoryView from '../views/AddStoryView.js';
import { addStory } from '../services/api.js';
import MapComponent from '../components/MapComponent.js';
import { showToast } from '../utils/helpers.js';
import { navigateTo } from '../utils/router.js';
import { triggerNotification, checkNotificationPermission, requestNotificationPermission } from '../services/notification.js';
import StoryModel from '../models/StoryModel.js';

class AddStoryPresenter {
  constructor() {
    this.mediaStream = null;
    this.map = null;
    this.selectedLocation = null;
    this.view = new AddStoryView({
      onSubmit: this.handleSubmit.bind(this),
      onInitMap: this.initMap.bind(this),
      onCameraOpen: this.openCamera.bind(this),
      onCapture: this.capturePhoto.bind(this),
      onUpload: this.triggerUpload.bind(this),
      onGetLocation: this.getCurrentLocation.bind(this),
      onLocationSelected: this.handleLocationSelected.bind(this),
      onPhotoCaptured: this.handlePhotoCaptured.bind(this),
      onPhotoUploaded: this.handlePhotoUploaded.bind(this)
    });
  }

  async init() {
    const element = this.view.render();
    setTimeout(() => this.view.afterRender(), 0);
    return element;
  }

  initMap() {
    console.log('Initializing map (online or offline with cached tiles)');
    this.map = new MapComponent('map-picker', {
      withLayerControl: true,
      clickable: true,
      initialZoom: 2
    }).init();

    this.map.setClickHandler((latlng) => {
      this.selectedLocation = latlng;
      this.view.updateLocationInputs(latlng.lat.toFixed(6), latlng.lng.toFixed(6));
      this.map.clearMarkers();
      this.map.addMarker(latlng.lat, latlng.lng, 'Selected location');
    });
  }

  handleLocationSelected(latlng) {
    this.selectedLocation = latlng;
  }

  async openCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.view.showCameraPreview(this.mediaStream);
    } catch (e) {
      showToast('Failed to access camera.', 'error');
    }
  }

  capturePhoto() {
    const photoData = this.view.capturePhotoFromCamera();
    if (photoData) {
      this.handlePhotoCaptured(photoData);
    }
  }

  handlePhotoCaptured(photoData) {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  triggerUpload() {
    this.view.triggerPhotoUpload();
  }

  handlePhotoUploaded(photoData) {
    // Handle uploaded photo data if needed
  }

  getCurrentLocation() {
    if (!navigator.onLine) {
      showToast('Geolocation unavailable offline. Click the map to select a location.', 'info');
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          this.selectedLocation = { lat: latitude, lng: longitude };
          this.view.updateLocationInputs(latitude.toFixed(6), longitude.toFixed(6));
          this.map.clearMarkers();
          this.map.addMarker(latitude, longitude, 'Your location');
          this.map.setView(latitude, longitude, 15);
        },
        () => showToast('Location access denied.', 'error')
      );
    }
  }

  async handleSubmit(formData) {
    try {
      // Validate required fields
      const description = formData.get('description');
      if (!description || description.trim() === '') {
        showToast('Please enter a description', 'error');
        return;
      }

      if (!formData.get('photo')) {
        showToast('Please add a photo', 'error');
        return;
      }

      // Show loading state
      showToast('Processing story...', 'info');

      // Create a temporary ID for offline storage
      const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (navigator.onLine) {
        try {
          console.log('Online: Attempting to submit story to API');
          await addStory(formData);
          showToast('Story added successfully!', 'success');
          
          // Check and request notification permission if needed
          const hasPermission = await checkNotificationPermission();
          if (!hasPermission) {
            await requestNotificationPermission();
          }
          
          // Send success notification
          await triggerNotification(
            'New Story Added', 
            'Your story has been successfully shared!'
          );
        } catch (onlineError) {
          console.error('Online submission failed, falling back to offline:', onlineError);
          await this.handleOfflineSubmission(formData, tempId);
        }
      } else {
        console.log('Offline: Queuing and saving story');
        await this.handleOfflineSubmission(formData, tempId);
      }

      navigateTo('#/stories');
    } catch (err) {
      console.error('Submit error:', err);
      showToast(err.message || 'Failed to process story', 'error');
    }
  }

  async handleOfflineSubmission(formData, tempId) {
    console.log('Handling offline submission');
    // Create a new FormData for offline storage with tempId
    const offlineFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      offlineFormData.append(key, value);
    }
    offlineFormData.append('id', tempId);
    await StoryModel.saveAndQueueStory(offlineFormData);
    showToast('Story queued for submission when online!', 'success');
    
    // Send offline notification
    await triggerNotification(
      'Story Queued', 
      'Your story will be submitted when you\'re back online!'
    );
  }

  destroy() {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.map?.destroy();
  }
}

export default AddStoryPresenter;