
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Armchair, 
  CalendarClock, 
  Settings as SettingsIcon, 
  LogOut,
  Library,
  TrendingUp,
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout: () => void;
  onAddStudent: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout, onAddStudent }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'seatmap', label: 'Seat Map', icon: Armchair },
    { id: 'timeline', label: 'Timeline', icon: CalendarClock },
    { id: 'bookings', label: 'Bookings', icon: TrendingUp },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-900/50">
          <Library className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">LibriSeat Pro</h1>
      </div>

      <div className="px-4 mb-4">
        <button 
          onClick={onAddStudent}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 group"
        >
          <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Register Member</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentView === item.id 
              ? 'bg-slate-800 text-white shadow-lg' 
              : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
