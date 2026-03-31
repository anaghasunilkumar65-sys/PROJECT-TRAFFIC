import { useState, useEffect, useRef } from 'react';
import { GoogleMap } from '../components/map/GoogleMap';
import { Search, MapPin, Navigation, MessageSquare, Plus, X, Camera, Send, CheckCircle2, AlertTriangle, SquareParking, ShoppingBag, Utensils, Hospital, Fuel } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { cn } from '@/src/lib/utils';
import { loadGoogleMaps } from '@/src/lib/googleMapsLoader';

const reportTypes = [
  { id: 'Accident', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'Traffic jam', icon: Navigation, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'Police checking', icon: Navigation, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'Road block', icon: X, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'Flooding', icon: Navigation, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { id: 'Construction', icon: Navigation, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'Signal malfunction', icon: Navigation, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'Event crowd', icon: Navigation, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'Road cleared', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
];

const nearbyCategories = [
  { id: 'shopping_mall', label: 'Malls', icon: ShoppingBag, color: 'bg-blue-500' },
  { id: 'restaurant', label: 'Food', icon: Utensils, color: 'bg-orange-500' },
  { id: 'hospital', label: 'Hospitals', icon: Hospital, color: 'bg-red-500' },
  { id: 'gas_station', label: 'Petrol', icon: Fuel, color: 'bg-green-500' },
  { id: 'store', label: 'Shops', icon: ShoppingBag, color: 'bg-indigo-500' },
];

export default function LiveMap() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [parkingSpots, setParkingSpots] = useState<any[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nearbyMarkersRef = useRef<google.maps.Marker[]>([]);

  // Load reports and parking from Firestore
  useEffect(() => {
    const unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    });

    const unsubParking = onSnapshot(collection(db, 'parking'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParkingSpots(data);
    });

    return () => {
      unsubReports();
      unsubParking();
    };
  }, []);

  // Handle markers on map
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    const markers: google.maps.Marker[] = [];

    // Add Report Markers
    reports.forEach(report => {
      const marker = new google.maps.Marker({
        position: report.location,
        map,
        title: report.type,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: report.type === 'Accident' ? '#ef4444' : '#f97316',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
          scale: 10,
        }
      });

      marker.addListener('click', () => {
        setSelectedMarker({ ...report, markerType: 'report' });
      });
      markers.push(marker);
    });

    // Add Parking Markers
    parkingSpots.forEach(spot => {
      const marker = new google.maps.Marker({
        position: spot.location,
        map,
        title: spot.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#8b5cf6',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
          scale: 10,
        }
      });

      marker.addListener('click', () => {
        setSelectedMarker({ ...spot, markerType: 'parking' });
      });
      markers.push(marker);
    });

    return () => {
      markers.forEach(m => m.setMap(null));
    };
  }, [map, reports, parkingSpots]);

  const handleMapLoad = async (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    try {
      await loadGoogleMaps();
      
      if (typeof google === 'undefined' || !google.maps || !google.maps.places) return;

      // Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(pos);
            mapInstance.setCenter(pos);
            mapInstance.setZoom(14);
            
            // Add user location marker
            new google.maps.Marker({
              position: pos,
              map: mapInstance,
              title: 'Your Location',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
              }
            });
          },
          () => {
            console.log('Geolocation permission denied');
          }
        );
      }

      // Places Autocomplete
      if (searchInputRef.current) {
        const keralaBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(8.17, 74.85),
          new google.maps.LatLng(12.8, 77.5)
        );

        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: 'IN' },
          bounds: keralaBounds,
          fields: ['geometry', 'name', 'formatted_address'],
          strictBounds: false,
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            mapInstance.setCenter(place.geometry.location);
            mapInstance.setZoom(14);
            setSearchQuery(place.formatted_address || '');
          }
        });
      }
    } catch (error) {
      console.error('Error in handleMapLoad:', error);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedReportType || !userLocation || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'reports'), {
        userId: auth.currentUser.uid,
        type: selectedReportType,
        description: reportDescription,
        location: userLocation,
        timestamp: new Date().toISOString(),
        confirmations: 0,
        notPresent: 0,
        cleared: 0,
        isVerified: false,
      });
      setShowReportModal(false);
      setSelectedReportType(null);
      setReportDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const handleVerify = async (reportId: string, action: 'confirm' | 'notPresent' | 'cleared') => {
    const reportRef = doc(db, 'reports', reportId);
    const field = action === 'confirm' ? 'confirmations' : action === 'notPresent' ? 'notPresent' : 'cleared';
    
    await updateDoc(reportRef, {
      [field]: increment(1)
    });

    // Auto-verify if 10 confirmations
    const snapshot = reports.find(r => r.id === reportId);
    if (snapshot && action === 'confirm' && snapshot.confirmations >= 9) {
      await updateDoc(reportRef, { isVerified: true });
    }
  };

  const handleSearchNearby = (type: string) => {
    if (!map || typeof google === 'undefined' || !google.maps || !google.maps.places) return;

    // Clear existing nearby markers
    nearbyMarkersRef.current.forEach(m => m.setMap(null));
    nearbyMarkersRef.current = [];

    const service = new google.maps.places.PlacesService(map);
    const request = {
      location: map.getCenter(),
      radius: 5000,
      type: type
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const markers = results.map(place => {
          if (!place.geometry || !place.geometry.location) return null;

          const marker = new google.maps.Marker({
            map,
            position: place.geometry.location,
            title: place.name,
            icon: {
              url: place.icon || '',
              scaledSize: new google.maps.Size(24, 24)
            }
          });

          marker.addListener('click', () => {
            setSelectedMarker({
              name: place.name,
              address: place.vicinity,
              rating: place.rating,
              markerType: 'place',
              location: place.geometry?.location?.toJSON()
            });
          });

          return marker;
        }).filter(m => m !== null) as google.maps.Marker[];

        nearbyMarkersRef.current = markers;
      }
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Search Bar & Categories */}
      <div className="absolute top-4 left-4 right-4 z-10 space-y-3">
        <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 px-4 py-3">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search cities, roads, landmarks..."
            className="flex-1 outline-none text-slate-800 font-medium placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="p-1 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
            <MapPin className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {nearbyCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSearchNearby(cat.id)}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/20 whitespace-nowrap hover:bg-white transition-colors"
            >
              <div className={cn("w-2 h-2 rounded-full", cat.color)}></div>
              <cat.icon className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-700">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Component */}
      <GoogleMap 
        onMapLoad={handleMapLoad} 
        className="h-full w-full" 
        center={userLocation || undefined}
      />

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-3 z-10">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowReportModal(true)}
          className="w-14 h-14 bg-orange-500 rounded-full shadow-xl shadow-orange-500/30 flex items-center justify-center text-white"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (userLocation && map) {
              map.setCenter(userLocation);
              map.setZoom(15);
            }
          }}
          className="w-14 h-14 bg-white rounded-full shadow-xl shadow-slate-900/10 flex items-center justify-center text-slate-600"
        >
          <Navigation className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Marker Info Panel */}
      <AnimatePresence>
        {selectedMarker && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-24 left-4 right-4 bg-white rounded-3xl shadow-2xl p-5 z-20 border border-slate-100"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-2xl",
                  selectedMarker.markerType === 'report' ? "bg-orange-50 text-orange-500" : "bg-purple-50 text-purple-500"
                )}>
                  {selectedMarker.markerType === 'report' ? <AlertTriangle className="w-6 h-6" /> : <SquareParking className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    {selectedMarker.markerType === 'report' ? selectedMarker.type : selectedMarker.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedMarker.markerType === 'report' ? `Reported ${new Date(selectedMarker.timestamp).toLocaleTimeString()}` : `Updated ${new Date(selectedMarker.lastUpdated).toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedMarker(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedMarker.markerType === 'report' ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">{selectedMarker.description || 'No additional details provided.'}</p>
                {selectedMarker.isVerified && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full w-fit">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Verified Report</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleVerify(selectedMarker.id, 'confirm')}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-bold transition-colors"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={() => handleVerify(selectedMarker.id, 'cleared')}
                    className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 py-3 rounded-xl text-sm font-bold transition-colors"
                  >
                    Mark Cleared
                  </button>
                </div>
              </div>
            ) : selectedMarker.markerType === 'parking' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Available</p>
                    <p className="text-xl font-bold text-slate-800">{selectedMarker.availableSlots} / {selectedMarker.totalSlots}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Price</p>
                    <p className="text-xl font-bold text-slate-800">₹{selectedMarker.pricePerHour}/hr</p>
                  </div>
                </div>
                <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20">
                  Navigate to Parking
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">{selectedMarker.address}</p>
                {selectedMarker.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-orange-500">★ {selectedMarker.rating}</span>
                  </div>
                )}
                <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20">
                  Navigate to Place
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Submit Report</h2>
                <button onClick={() => setShowReportModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {reportTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedReportType(type.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                      selectedReportType === type.id ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    <type.icon className={cn("w-6 h-6", selectedReportType === type.id ? "text-white" : type.color)} />
                    <span className="text-[10px] font-bold text-center leading-tight">{type.id}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 mb-8">
                <textarea
                  placeholder="Describe the situation (optional)..."
                  className="w-full bg-slate-50 rounded-2xl p-4 text-slate-700 outline-none border border-transparent focus:border-orange-500 transition-colors min-h-[100px]"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                />
                <button className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
                  <Camera className="w-5 h-5" />
                  Add Photo
                </button>
              </div>

              <button 
                onClick={handleSubmitReport}
                disabled={!selectedReportType}
                className="w-full bg-orange-500 disabled:bg-slate-200 text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Broadcast Update
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
