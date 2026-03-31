import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

let initialized = false;
let loadingPromise: Promise<any> | null = null;

export const initGoogleMaps = () => {
  if (!initialized) {
    const apiKey = import.meta.env.VITE_APIKEY2 || import.meta.env.VITE_GOOGLE_MAP_API;
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }
    setOptions({
      key: apiKey,
      v: 'weekly',
      libraries: ['places', 'geometry', 'visualization']
    });
    initialized = true;
  }
};

export const loadGoogleMaps = async () => {
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      initGoogleMaps();
      // Import core libraries to ensure they are available
      await Promise.all([
        importLibrary('maps'),
        importLibrary('places'),
        importLibrary('geometry'),
        importLibrary('visualization')
      ]);
      return google.maps;
    } catch (error) {
      loadingPromise = null; // Allow retry on failure
      throw error;
    }
  })();

  return loadingPromise;
};

export const resetGoogleMapsLoader = () => {
  loadingPromise = null;
};
