import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Route, MessageSquare, Bell, SquareParking, Bus, User } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Map, label: 'Map', path: '/map' },
  { icon: Route, label: 'Route', path: '/route' },
  { icon: MessageSquare, label: 'Reports', path: '/reports' },
  { icon: Bell, label: 'Alerts', path: '/alerts' },
  { icon: SquareParking, label: 'Parking', path: '/parking' },
  { icon: Bus, label: 'Transport', path: '/transport' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                isActive ? "text-orange-500" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
