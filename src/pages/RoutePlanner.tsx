import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Search, Navigation, MapPin, Route, Clock, AlertTriangle, Cloud, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { cn } from '@/src/lib/utils';
import { loadGoogleMaps } from '@/src/lib/googleMapsLoader';

export default function RoutePlanner() {
  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const startRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const initAutocomplete = async () => {
      try {
        await loadGoogleMaps();
        
        if (!isMounted) return;

        // Ensure google is defined before accessing it
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
          console.error('Google Maps Places API not available');
          return;
        }

        // Initialize Google Places Autocomplete for both inputs
        const options = { componentRestrictions: { country: 'IN' }, fields: ['formatted_address', 'geometry'] };
        
        if (startRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(startRef.current, options);
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            setStart(place.formatted_address || '');
          });
        }

        if (destRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(destRef.current, options);
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            setDestination(place.formatted_address || '');
          });
        }
      } catch (error) {
        console.error('Failed to initialize Autocomplete:', error);
      }
    };

    initAutocomplete();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAnalyzeRoute = async () => {
    if (!start || !destination) return;
    setLoading(true);
    setAiAnalysis(null);

    try {
      // Fetch current reports to provide context to Gemini
      const reportsSnapshot = await getDocs(collection(db, 'reports'));
      const reports = reportsSnapshot.docs.map(doc => doc.data());
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the route from "${start}" to "${destination}" in Kerala.
        Context:
        - Community Reports: ${JSON.stringify(reports.slice(0, 10))}
        - Weather: Assume typical Kerala monsoon/summer conditions based on current time.
        
        Provide:
        1. Best route recommendation.
        2. Alternative routes.
        3. Predicted delays based on congestion and reports.
        4. Estimated arrival time.
        5. Safety tips for this specific journey.
        
        Format the output in professional Markdown with clear sections.`,
      });

      setAiAnalysis(response.text);
      
      // Mock routes for UI
      setRoutes([
        { id: 1, name: 'Main Highway (NH 66)', time: '45 mins', distance: '22 km', delay: '5 mins', type: 'Fastest' },
        { id: 2, name: 'Coastal Road', time: '55 mins', distance: '25 km', delay: 'None', type: 'Scenic' },
      ]);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setAiAnalysis('Failed to analyze route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Route Planner</h1>
        <p className="text-sm text-slate-500 font-medium">AI-powered journey intelligence</p>
      </header>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-900/5 border border-slate-100 space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
          <input
            ref={startRef}
            type="text"
            placeholder="Starting point"
            className="w-full bg-slate-50 rounded-2xl py-4 pl-10 pr-4 text-sm font-medium outline-none border border-transparent focus:border-blue-500 transition-colors"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full"></div>
          <input
            ref={destRef}
            type="text"
            placeholder="Destination"
            className="w-full bg-slate-50 rounded-2xl py-4 pl-10 pr-4 text-sm font-medium outline-none border border-transparent focus:border-orange-500 transition-colors"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        <button 
          onClick={handleAnalyzeRoute}
          disabled={loading || !start || !destination}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-orange-400" />}
          Analyze with AI
        </button>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Consulting Gemini AI...</p>
          </motion.div>
        )}

        {aiAnalysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* AI Analysis Card */}
            <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-orange-900">AI Traffic Intelligence</h3>
              </div>
              <div className="prose prose-sm prose-orange max-w-none">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            </div>

            {/* Route Cards */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-800 px-2">Suggested Routes</h3>
              {routes.map((route) => (
                <div key={route.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-transform">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      route.type === 'Fastest' ? "bg-blue-50 text-blue-500" : "bg-green-50 text-green-500"
                    )}>
                      <Route className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800">{route.name}</h4>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                          route.type === 'Fastest' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                        )}>
                          {route.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {route.time}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {route.distance}
                        </span>
                        {route.delay !== 'None' && (
                          <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {route.delay} delay
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
                </div>
              ))}
            </div>

            <button className="w-full bg-orange-500 text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2">
              <Navigation className="w-5 h-5" />
              Start Navigation
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
