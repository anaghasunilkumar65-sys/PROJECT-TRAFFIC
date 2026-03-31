import { useState } from 'react';
import { Bus, Train, Navigation, Clock, Search, MapPin, ArrowRight, Info, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

const transportData = [
  { id: '1', type: 'Bus', name: 'KSRTC Fast Passenger', route: 'Kochi - Trivandrum', nextStop: 'Alappuzha', delay: '5m', occupancy: 'High', color: 'bg-blue-50 text-blue-500' },
  { id: '2', type: 'Metro', name: 'Kochi Metro', route: 'Aluva - SN Junction', nextStop: 'Edappally', delay: 'On Time', occupancy: 'Medium', color: 'bg-green-50 text-green-500' },
  { id: '3', type: 'Train', name: 'Venad Express', route: 'Trivandrum - Shoranur', nextStop: 'Ernakulam Town', delay: '10m', occupancy: 'Full', color: 'bg-orange-50 text-orange-500' },
  { id: '4', type: 'Bus', name: 'Private Bus (Route 45)', route: 'Vyttila - Kakkanad', nextStop: 'Palarivattom', delay: '2m', occupancy: 'Medium', color: 'bg-blue-50 text-blue-500' },
];

export default function PublicTransport() {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = transportData.filter(item => 
    (filter === 'All' || item.type === filter) &&
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.route.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Public Transport</h1>
          <p className="text-sm text-slate-500 font-medium">Live bus, train, and metro updates</p>
        </div>
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Bus className="w-5 h-5" />
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative flex items-center bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3">
        <Search className="w-5 h-5 text-slate-400 mr-3" />
        <input
          type="text"
          placeholder="Search routes or services..."
          className="flex-1 outline-none text-slate-800 font-medium placeholder:text-slate-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {['All', 'Bus', 'Metro', 'Train'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
              filter === type ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white text-slate-500 border border-slate-100"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredData.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={cn("p-3 rounded-2xl", item.color)}>
                  {item.type === 'Bus' ? <Bus className="w-6 h-6" /> : item.type === 'Metro' ? <Navigation className="w-6 h-6" /> : <Train className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{item.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{item.route}</p>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                item.delay === 'On Time' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              )}>
                {item.delay}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Next Stop</p>
                </div>
                <p className="text-sm font-bold text-slate-800">{item.nextStop}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Occupancy</p>
                </div>
                <p className={cn(
                  "text-sm font-bold",
                  item.occupancy === 'High' || item.occupancy === 'Full' ? "text-red-500" : "text-green-600"
                )}>
                  {item.occupancy}
                </p>
              </div>
            </div>

            <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
              <Info className="w-4 h-4" />
              View Full Schedule
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
