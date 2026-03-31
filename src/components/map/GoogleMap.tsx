import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, resetGoogleMapsLoader } from '@/src/lib/googleMapsLoader';
import { AlertTriangle, Info, Activity, Navigation2, Zap, Radio, ShieldAlert } from 'lucide-react';

interface GoogleMapProps {
  onMapLoad?: (map: google.maps.Map) => void;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  className?: string;
}

const KERALA_CENTER = { lat: 10.8505, lng: 76.2711 };

export function GoogleMap({ onMapLoad, center, zoom = 12, className }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [troubleshooting, setTroubleshooting] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [showTrafficTrends, setShowTrafficTrends] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initMap = async () => {
      setIsLoading(true);
      setError(null);
      setApiKeyMissing(false);
      setTroubleshooting(false);

      try {
        const apiKey = import.meta.env.VITE_APIKEY2 || import.meta.env.VITE_GOOGLE_MAP_API;
        if (!apiKey) {
          console.log('Map loading failed: API key missing');
          setApiKeyMissing(true);
          setIsLoading(false);
          return;
        }
        console.log('API key detected');

        // 8 second timeout
        timeoutId = setTimeout(() => {
          if (isLoading && isMounted) {
            console.log('Map loading failed: Timeout');
            setError('Google Maps failed to load. Please check the API key configuration.');
            setIsLoading(false);
          }
        }, 8000);

        console.log('Loading Google Maps script');
        await loadGoogleMaps();
        
        if (!isMounted || !mapRef.current) return;

        // Ensure google is defined before accessing it
        if (typeof google === 'undefined' || !google.maps) {
          console.log('Map loading failed: Google object undefined');
          setTroubleshooting(true);
          throw new Error('Google Maps API could not be loaded.');
        }
        console.log('Google Maps script loaded');
        console.log('Initializing map');

        // Get initial center
        let initialCenter = center || KERALA_CENTER;
        if (!center && navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { 
                timeout: 5000,
                enableHighAccuracy: true 
              });
            });
            initialCenter = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
          } catch (geoError) {
            console.log('Geolocation denied or failed, automatically centering the map on Kerala');
          }
        }

        const map = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: true,
          rotateControl: true,
          fullscreenControl: true,
          gestureHandling: 'greedy',
          styles: [
            {
              featureType: 'transit',
              elementType: 'labels.icon',
              stylers: [{ visibility: 'on' }]
            }
          ]
        });

        // Add traffic layer
        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);

        // Add transit layer
        const transitLayer = new google.maps.TransitLayer();
        transitLayer.setMap(map);

        // Add mock "Smart Traffic Solutions" markers
        const addSmartMarkers = () => {
          const offset = 0.01;
          const smartMarkers = [
            { lat: initialCenter.lat + offset, lng: initialCenter.lng + offset, type: 'AI Signal', icon: '🚦' },
            { lat: initialCenter.lat - offset, lng: initialCenter.lng - offset, type: 'Vehicle Sensor', icon: '📡' },
            { lat: initialCenter.lat + offset, lng: initialCenter.lng - offset, type: 'Emergency Lane', icon: '🚑' },
            { lat: initialCenter.lat - offset, lng: initialCenter.lng + offset, type: 'Accident Zone', icon: '⚠️' }
          ];

          smartMarkers.forEach(markerData => {
            const marker = new google.maps.Marker({
              position: { lat: markerData.lat, lng: markerData.lng },
              map,
              title: markerData.type,
              label: {
                text: markerData.icon,
                fontSize: '20px'
              }
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `<div class="p-2 font-sans">
                <h3 class="font-bold text-slate-800">${markerData.type}</h3>
                <p class="text-xs text-slate-600">Real-time smart traffic optimization active.</p>
              </div>`
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
          });

          // Add accident-prone zones (circles)
          new google.maps.Circle({
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            map,
            center: { lat: initialCenter.lat + 0.02, lng: initialCenter.lng + 0.02 },
            radius: 500,
          });
        };

        addSmartMarkers();

        // Add mock "Alternate Routes" (Polylines)
        const alternateRoute = [
          { lat: initialCenter.lat, lng: initialCenter.lng },
          { lat: initialCenter.lat + 0.005, lng: initialCenter.lng + 0.01 },
          { lat: initialCenter.lat + 0.01, lng: initialCenter.lng + 0.015 }
        ];

        const routePath = new google.maps.Polyline({
          path: alternateRoute,
          geodesic: true,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map
        });

        if (onMapLoad) {
          onMapLoad(map);
        }
        
        clearTimeout(timeoutId);
        setIsLoading(false);
        console.log('Map initialized successfully');
      } catch (e) {
        console.log('Map loading failed');
        if (isMounted) {
          clearTimeout(timeoutId);
          if (!troubleshooting) {
            setError('Google Maps failed to load. Please check the API key configuration.');
          }
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [center, zoom, onMapLoad, retryTrigger]);

  const handleRetry = () => {
    resetGoogleMapsLoader();
    setRetryTrigger(prev => prev + 1);
  };

  if (apiKeyMissing) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[450px] bg-slate-100 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-sm">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-orange-500 text-2xl font-bold">!</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">API Key Missing</h3>
          <p className="text-slate-600 mb-6">
            Google Maps API key is not configured. Please add <code className="bg-slate-100 px-1 rounded">VITE_APIKEY2</code> in AI Studio Secrets.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[450px] bg-slate-100 p-6 text-center">
        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading live map...</p>
        </div>
      </div>
    );
  }

  if (troubleshooting) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[450px] bg-slate-100 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-sm border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Initialization Error</h3>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Google Maps API could not be loaded. Ensure the Maps JavaScript API is enabled in the Google Cloud Console and the API key is valid.
          </p>
          <button 
            onClick={handleRetry}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm"
          >
            Troubleshoot & Retry
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-slate-100 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-sm">
          <p className="text-slate-800 font-bold mb-2">Something went wrong</p>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button 
            onClick={handleRetry}
            className="text-sm font-bold text-orange-500 hover:underline"
          >
            Retry Loading Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className={`min-h-[450px] w-full ${className}`} />
      
      {/* Traffic Trends Overlay */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={() => setShowTrafficTrends(!showTrafficTrends)}
          className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20 text-slate-700 hover:bg-white transition-all flex items-center gap-2"
        >
          <Activity className="w-5 h-5 text-orange-500" />
          <span className="text-xs font-bold uppercase tracking-wider">Traffic Trends</span>
        </button>
        
        {showTrafficTrends && (
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/20 w-64 animate-in fade-in slide-in-from-right-4 duration-300">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Navigation2 className="w-4 h-4 text-blue-500" />
              Peak Hour Prediction
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">08:00 - 10:00</span>
                <span className="text-xs font-bold text-red-500">Heavy</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full w-[90%]"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">12:00 - 14:00</span>
                <span className="text-xs font-bold text-yellow-500">Moderate</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full w-[45%]"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">17:00 - 19:00</span>
                <span className="text-xs font-bold text-red-500">Critical</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full w-[95%]"></div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200/50">
              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                AI-based signal optimization active. Emergency lanes prioritized for medical vehicles.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Free Flow</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Heavy</span>
        </div>
      </div>
    </div>
  );
}
