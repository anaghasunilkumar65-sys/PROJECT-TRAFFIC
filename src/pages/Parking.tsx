import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { SquareParking, MapPin, Clock, Navigation, Plus, X, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

export default function Parking() {
  const [parkingSpots, setParkingSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'parking'), orderBy('availableSlots', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParkingSpots(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredSpots = parkingSpots.filter(spot => 
    spot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Smart Parking</h1>
          <p className="text-sm text-slate-500 font-medium">Find and report parking availability</p>
        </div>
        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
          <SquareParking className="w-5 h-5" />
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative flex items-center bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3">
        <Search className="w-5 h-5 text-slate-400 mr-3" />
        <input
          type="text"
          placeholder="Search parking locations..."
          className="flex-1 outline-none text-slate-800 font-medium placeholder:text-slate-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] animate-pulse h-40"></div>
          ))
        ) : filteredSpots.length > 0 ? (
          filteredSpots.map((spot) => (
            <motion.div 
              key={spot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-50 text-purple-500">
                    <SquareParking className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{spot.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Updated {new Date(spot.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">₹{spot.pricePerHour}/hr</span>
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  spot.availableSlots > 10 ? "bg-green-50 text-green-600" : spot.availableSlots > 0 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
                )}>
                  {spot.availableSlots > 0 ? `${spot.availableSlots} Available` : 'Full'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Slots</p>
                  <p className="text-lg font-bold text-slate-800">{spot.totalSlots}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Available</p>
                  <p className={cn(
                    "text-lg font-bold",
                    spot.availableSlots > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {spot.availableSlots}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link 
                  to="/map" 
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-2xl text-xs font-bold transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Navigate
                </Link>
                <button 
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Report Available
                </button>
                <button 
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                  Report Full
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-[40px] border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <SquareParking className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">No parking found</h3>
              <p className="text-sm text-slate-400">Try searching for a different location.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
