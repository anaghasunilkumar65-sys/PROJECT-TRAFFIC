import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User as UserIcon, LogOut, Settings, Shield, Bell, Map, History, Award, LogIn, ChevronRight, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // Create profile if it doesn't exist
          const newProfile = {
            name: user.displayName,
            email: user.email,
            role: 'user',
            points: 100,
            reportsCount: 0,
            joinedAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-8">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
          <UserIcon className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome to VazhiGo</h2>
          <p className="text-slate-500 mt-2">Join our community to report traffic, earn points, and get personalized route suggestions.</p>
        </div>
        <button 
          onClick={handleLogin}
          className="w-full bg-orange-500 text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <LogIn className="w-6 h-6" />
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-10">
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-24 h-24 rounded-full border-4 border-orange-500 p-1 mx-auto mb-4">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt={user.displayName || 'User'} 
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{user.displayName}</h2>
          <p className="text-sm text-slate-500 font-medium">{user.email}</p>
          
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full flex items-center gap-2">
              <Star className="w-4 h-4 fill-orange-500" />
              <span className="text-sm font-bold">{profile?.points || 0} Points</span>
            </div>
            <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="text-sm font-bold">Level 1</span>
            </div>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Reports</p>
          <p className="text-2xl font-bold text-slate-800">{profile?.reportsCount || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Member Since</p>
          <p className="text-sm font-bold text-slate-800">
            {new Date(profile?.joinedAt || user.metadata.creationTime || '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {[
            { icon: History, label: 'Journey History', color: 'text-blue-500' },
            { icon: Map, label: 'Offline Map Regions', color: 'text-green-500' },
            { icon: Bell, label: 'Notification Settings', color: 'text-orange-500' },
            { icon: Shield, label: 'Privacy & Security', color: 'text-purple-500' },
            { icon: Settings, label: 'App Settings', color: 'text-slate-500' },
          ].map((item, i) => (
            <button 
              key={i}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.color.replace('text', 'bg') + '/10', item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 bg-red-50 text-red-600 py-5 rounded-3xl font-bold hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Logout from VazhiGo
      </button>

      <div className="text-center pb-4">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">VazhiGo v1.0.0 • Made for Kerala</p>
      </div>
    </div>
  );
}
