class AddStoryView {
  constructor({
    onSubmit,
    onInitMap,
    onCameraOpen,
    onCapture,
    onUpload,
    onGetLocation,
    onLocationSelected,
    onPhotoCaptured,
    onPhotoUploaded
  }) {
    this.onSubmit = onSubmit;
    this.onInitMap = onInitMap;
    this.onCameraOpen = onCameraOpen;
    this.onCapture = onCapture;
    this.onUpload = onUpload;
    this.onGetLocation = onGetLocation;
    this.onLocationSelected = onLocationSelected;
    this.onPhotoCaptured = onPhotoCaptured;
    this.onPhotoUploaded = onPhotoUploaded;
    this.capturedPhotoBlob = null;
  }

  render() {
    const section = document.createElement('section');
    section.className = 'add-story slide-left';
    section.innerHTML = `
      <h1>Add New Story</h1>
      <div class="form-container">
        <form id="story-form">
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" class="form-control" required></textarea>
          </div>
          <div class="form-group">
            <label>Photo</label>
            <div class="camera-container">
              <div class="camera-preview" id="camera-preview">
                <p>No image selected</p>
              </div>
              <div class="camera-buttons">
                <button type="button" class="btn btn-outline" id="open-camera-btn">
                  <i class="fas fa-camera"></i> Open Camera
                </button>
                <button type="button" class="btn btn-outline" id="capture-btn" disabled>
                  <i class="fas fa-camera-retro"></i> Capture
                </button>
                <button type="button" class="btn btn-outline" id="upload-btn">
                  <i class="fas fa-upload"></i> Upload
                </button>
                <input type="file" id="photo-input" accept="image/*" style="display: none;">
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Location (optional)</label>
            <div class="map-picker" id="map-picker"></div>
            <div class="coordinates">
              <div class="form-group">
                <label for="latitude">Latitude</label>
                <input type="number" id="latitude" class="form-control" step="any" readonly>
              </div>
              <div class="form-group">
                <label for="longitude">Longitude</label>
                <input type="number" id="longitude" class="form-control" step="any" readonly>
              </div>
            </div>
            <button type="button" class="btn btn-outline" id="get-location-btn">
              <i class="fas fa-location-arrow"></i> Use Current Location
            </button>
          </div>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-paper-plane"></i> Submit Story
          </button>
        </form>
      </div>
    `;
    return section;
  }

  afterRender() {
    console.log('Initializing map (online or offline with cached tiles)');
    this.onInitMap?.();

    document.getElementById('open-camera-btn')?.addEventListener('click', this.onCameraOpen);
    document.getElementById('capture-btn')?.addEventListener('click', this.onCapture);
    document.getElementById('upload-btn')?.addEventListener('click', this.onUpload);
    document.getElementById('get-location-btn')?.addEventListener('click', this.onGetLocation);
    
    document.getElementById('story-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Create FormData
      const formData = new FormData();
      formData.append('description', document.getElementById('description').value);
      
      // Handle photo from file input
      const fileInput = document.getElementById('photo-input');
      if (fileInput.files[0]) {
        formData.append('photo', fileInput.files[0]);
      } 
      // Handle photo from camera capture
      else if (this.capturedPhotoBlob) {
        formData.append('photo', this.capturedPhotoBlob, 'captured.jpg');
      }
      
      // Handle location
      const latInput = document.getElementById('latitude');
      const lonInput = document.getElementById('longitude');
      if (latInput.value && lonInput.value) {
        formData.append('lat', latInput.value);
        formData.append('lon', lonInput.value);
      }
      
      this.onSubmit(formData);
    });
    
    document.getElementById('photo-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.size > 1024 * 1024) { // 1MB limit
        showToast('Image too large (max 1MB)', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        this.showPhotoPreview(event.target.result);
        this.onPhotoUploaded?.(file);
      };
      reader.readAsDataURL(file);
    });
  }

  showCameraPreview(mediaStream) {
    const preview = document.getElementById('camera-preview');
    preview.innerHTML = '<video autoplay playsinline></video>';
    const video = preview.querySelector('video');
    video.srcObject = mediaStream;
    document.getElementById('capture-btn').disabled = false;
    document.getElementById('open-camera-btn').disabled = true;
  }

  capturePhotoFromCamera() {
    const video = document.querySelector('#camera-preview video');
    if (!video) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const imgData = canvas.toDataURL('image/jpeg', 0.7); // Compress to 70% quality
    this.showPhotoPreview(imgData);
    
    document.getElementById('capture-btn').disabled = true;
    document.getElementById('open-camera-btn').disabled = false;
    
    this.capturedPhotoBlob = this.dataURLtoBlob(imgData);
    this.onPhotoCaptured?.(this.capturedPhotoBlob);
    return this.capturedPhotoBlob;
  }

  showPhotoPreview(imageSrc) {
    const preview = document.getElementById('camera-preview');
    preview.innerHTML = '';
    const img = document.createElement('img');
    img.src = imageSrc;
    preview.appendChild(img);
  }

  updateLocationInputs(lat, lng) {
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
  }

  triggerPhotoUpload() {
    document.getElementById('photo-input').click();
  }

  disableMap() {
    console.log('Disabling map UI');
    document.getElementById('map-picker').innerHTML = '<p>Map unavailable</p>';
    document.getElementById('get-location-btn').disabled = true;
    document.getElementById('latitude').disabled = true;
    document.getElementById('longitude').disabled = true;
  }

  dataURLtoBlob(dataURL) {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  }

  destroy() {
    const video = document.querySelector('#camera-preview video');
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
  }
}

export default AddStoryView;