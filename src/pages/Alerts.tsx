import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Bell, AlertTriangle, MapPin, Clock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlerts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Real-time Alerts</h1>
          <p className="text-sm text-slate-500 font-medium">Critical updates for your journey</p>
        </div>
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/20">
          <Bell className="w-5 h-5" />
        </div>
      </header>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] animate-pulse h-32"></div>
          ))
        ) : alerts.length > 0 ? (
          alerts.map((alert) => (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4",
                alert.severity === 'critical' && "border-red-100 bg-red-50/30"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    alert.severity === 'critical' ? "bg-red-500 text-white" : "bg-orange-50 text-orange-500"
                  )}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{alert.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        alert.severity === 'critical' ? "text-red-500" : "text-orange-500"
                      )}>
                        {alert.severity} Severity
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{alert.description}</p>

              <div className="flex items-center gap-3 pt-2">
                <Link 
                  to="/map" 
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-2xl text-xs font-bold transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  View on Map
                </Link>
                <button 
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm
                </button>
                <button 
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Cleared
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-[40px] border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">All clear!</h3>
              <p className="text-sm text-slate-400">No active alerts in your area.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
