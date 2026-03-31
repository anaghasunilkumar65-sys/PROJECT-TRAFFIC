/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/layout/BottomNav';
import Home from './pages/Home';
import LiveMap from './pages/LiveMap';
import RoutePlanner from './pages/RoutePlanner';
import CommunityReports from './pages/CommunityReports';
import Alerts from './pages/Alerts';
import Parking from './pages/Parking';
import PublicTransport from './pages/PublicTransport';
import Profile from './pages/Profile';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading VazhiGo...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
          <main className="flex-1 overflow-y-auto pb-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<LiveMap />} />
              <Route path="/route" element={<RoutePlanner />} />
              <Route path="/reports" element={<CommunityReports />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/parking" element={<Parking />} />
              <Route path="/transport" element={<PublicTransport />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
