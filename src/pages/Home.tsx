import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Route, MessageSquare, Bell, SquareParking, Bus, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';

const quickActions = [
  { icon: Map, label: 'Live Map', path: '/map', color: 'bg-blue-500' },
  { icon: Route, label: 'Route Planner', path: '/route', color: 'bg-orange-500' },
  { icon: MessageSquare, label: 'Report', path: '/reports', color: 'bg-green-500' },
  { icon: SquareParking, label: 'Parking', path: '/parking', color: 'bg-purple-500' },
];

export default function Home() {
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentAlerts(alerts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">VazhiGo</h1>
          <p className="text-sm text-slate-500 font-medium italic">“Smart Ways. Faster Journeys.”</p>
        </div>
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
          V
        </div>
      </header>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/30 relative overflow-hidden"
      >
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2">Where are you going today?</h2>
          <p className="text-orange-100 text-sm mb-6 opacity-90">Get real-time traffic updates and AI-powered route suggestions across Kerala.</p>
          <Link 
            to="/route" 
            className="bg-white text-orange-600 px-6 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-orange-50 transition-colors"
          >
            <Route className="w-4 h-4" />
            Plan Route
          </Link>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Quick Actions */}
      <section>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link 
              key={action.path} 
              to={action.path}
              className="flex flex-col items-center gap-2"
            >
              <div className={`${action.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${action.color.split('-')[1]}-500/20 active:scale-95 transition-transform`}>
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Alerts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Live Alerts
          </h3>
          <Link to="/alerts" className="text-sm font-bold text-orange-500">View All</Link>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white p-4 rounded-2xl animate-pulse h-24"></div>
          ) : recentAlerts.length > 0 ? (
            recentAlerts.map((alert) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{alert.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{alert.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{alert.severity}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
              <p className="text-slate-400 text-sm">No active alerts in your area.</p>
            </div>
          )}
        </div>
      </section>

      {/* Public Transport Preview */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-500" />
            Public Transport
          </h3>
          <Link to="/transport" className="text-sm font-bold text-orange-500">Details</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="bg-blue-50 p-3 rounded-2xl min-w-[140px] shrink-0">
            <span className="text-[10px] font-bold text-blue-500 uppercase">KSRTC Bus</span>
            <p className="text-sm font-bold text-slate-800 mt-1">Route 45A</p>
            <p className="text-[10px] text-slate-500">Next: Edappally (5m)</p>
          </div>
          <div className="bg-green-50 p-3 rounded-2xl min-w-[140px] shrink-0">
            <span className="text-[10px] font-bold text-green-500 uppercase">Kochi Metro</span>
            <p className="text-sm font-bold text-slate-800 mt-1">Aluva - SN Junc</p>
            <p className="text-[10px] text-slate-500">Every 7 mins</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-2xl min-w-[140px] shrink-0">
            <span className="text-[10px] font-bold text-orange-500 uppercase">Train</span>
            <p className="text-sm font-bold text-slate-800 mt-1">Venad Express</p>
            <p className="text-[10px] text-slate-500">On Time</p>
          </div>
        </div>
      </section>
    </div>
  );
}
