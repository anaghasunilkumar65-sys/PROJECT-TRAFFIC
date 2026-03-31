import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { MessageSquare, AlertTriangle, CheckCircle2, Navigation, X, Clock, MapPin, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function CommunityReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleVerify = async (reportId: string, action: 'confirm' | 'notPresent' | 'cleared') => {
    const reportRef = doc(db, 'reports', reportId);
    const field = action === 'confirm' ? 'confirmations' : action === 'notPresent' ? 'notPresent' : 'cleared';
    
    await updateDoc(reportRef, {
      [field]: increment(1)
    });
  };

  const filteredReports = filter === 'All' ? reports : reports.filter(r => r.type === filter);

  const reportTypes = ["All", "Accident", "Traffic jam", "Police checking", "Road block", "Flooding", "Construction", "Signal malfunction", "Event crowd", "Road cleared"];

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Reports</h1>
          <p className="text-sm text-slate-500 font-medium">Live road updates from fellow travelers</p>
        </div>
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
          <MessageSquare className="w-5 h-5" />
        </div>
      </header>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {reportTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
              filter === type ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-white text-slate-500 border border-slate-100"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] animate-pulse h-40"></div>
          ))
        ) : filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <motion.div 
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    report.type === 'Accident' ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"
                  )}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{report.type}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {report.location.address || 'Nearby'}
                      </span>
                    </div>
                  </div>
                </div>
                {report.isVerified && (
                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Verified</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{report.description || 'No additional details provided.'}</p>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={() => handleVerify(report.id, 'confirm')}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Confirm ({report.confirmations || 0})
                </button>
                <button 
                  onClick={() => handleVerify(report.id, 'notPresent')}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Not Present ({report.notPresent || 0})
                </button>
                <button 
                  onClick={() => handleVerify(report.id, 'cleared')}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 py-3 rounded-2xl text-xs font-bold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Cleared ({report.cleared || 0})
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-[40px] border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">No reports found</h3>
              <p className="text-sm text-slate-400">Be the first to update the community!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
