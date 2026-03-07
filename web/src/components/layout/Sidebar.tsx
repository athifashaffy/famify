import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, MessageCircle, MapPin, Bell, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/planner', icon: CalendarDays, label: 'Planner' },
  { to: '/feed', icon: MessageCircle, label: 'Feed' },
  { to: '/needle', icon: MapPin, label: 'Needle' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  return (
    <div className="hidden md:flex w-64 bg-white border-r border-slate-200 h-screen flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Famify Logo" className="w-12 h-12" />
          <div>
            <h1 className="text-2xl font-display font-extrabold text-emerald-600 tracking-tight">Famify</h1>
            <p className="text-xs text-slate-600 font-medium">Family Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors',
                isActive
                  ? 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-500'
                  : 'text-slate-600 hover:bg-slate-50'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function MobileHeader() {
  return (
    <div className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="Famify Logo" className="w-8 h-8" />
        <h1 className="text-xl font-display font-extrabold text-emerald-600 tracking-tight">Famify</h1>
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom">
      <nav className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors min-w-0',
                isActive
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
