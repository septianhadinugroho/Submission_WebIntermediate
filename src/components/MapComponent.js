import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png'
});

// Override _getIconUrl to use fallback
L.Icon.Default.prototype._getIconUrl = function (name) {
  const url = L.Icon.Default.prototype.options[name + 'Url'];
  const fallbackUrl = L.Icon.Default.prototype.options[name + 'UrlFallback'];
  if (!navigator.onLine && !caches.match(url)) {
    console.warn(`Falling back to CDN for ${name}: ${fallbackUrl}`);
    return fallbackUrl;
  }
  return url;
};

export default class MapComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      withLayerControl: false,
      initialLocation: [0, 0],
      initialZoom: 2,
      clickable: false,
      ...options,
    };
    this.map = null;
    this.markers = [];
    this.clickHandler = null;
  }

  init() {
    try {
      console.log('Initializing Leaflet map (online or offline)');
      this.map = L.map(this.containerId, { renderer: L.canvas() }).setView(this.options.initialLocation, this.options.initialZoom);

      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });

      const osmHotLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
      });

      const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      });

      osmLayer.addTo(this.map);

      if (this.options.withLayerControl) {
        const baseLayers = {
          OpenStreetMap: osmLayer,
          'Humanitarian OSM': osmHotLayer,
          'Dark Mode': darkLayer,
        };
        L.control.layers(baseLayers, null, { position: 'topright' }).addTo(this.map);
      }

      if (this.options.clickable) {
        this.map.on('click', (e) => {
          if (this.clickHandler) {
            console.log('Map clicked offline, setting location:', e.latlng);
            this.clickHandler(e.latlng);
          }
        });
      }

      console.log('Map initialized successfully');
      return this;
    } catch (error) {
      console.error('Failed to initialize map:', error);
      throw error;
    }
  }

  addMarker(lat, lng, popupContent = '', options = {}) {
    try {
      const marker = L.marker([lat, lng], options).addTo(this.map);
      if (popupContent) {
        marker.bindPopup(popupContent);
      }
      this.markers.push(marker);
      console.log('Marker added:', { lat, lng, popupContent });
      return marker;
    } catch (error) {
      console.error('Failed to add marker:', error);
      throw error;
    }
  }

  clearMarkers() {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
    console.log('Markers cleared');
  }

  setClickHandler(handler) {
    this.clickHandler = handler;
  }

  setView(lat, lng, zoom = 13) {
    this.map.setView([lat, lng], zoom);
    console.log('Map view set:', { lat, lng, zoom });
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      console.log('Map destroyed');
    }
  }
}