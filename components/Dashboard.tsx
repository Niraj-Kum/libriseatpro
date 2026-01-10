
import React from 'react';
import { 
  Users, 
  Armchair, 
  IndianRupee, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Booking, DashboardStats } from '../types';
import { CURRENCY_FORMATTER } from '../constants';

interface DashboardProps {
  stats: DashboardStats;
  bookings: Booking[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, bookings }) => {
  const revenueData = [
    { name: 'M', revenue: 4500 },
    { name: 'T', revenue: 5200 },
    { name: 'W', revenue: 3800 },
    { name: 'T', revenue: 6100 },
    { name: 'F', revenue: 4900 },
    { name: 'S', revenue: 7200 },
    { name: 'S', revenue: 5800 },
  ];

  const occupancyRate = Math.round((stats.liveOccupancy / stats.totalSeats) * 100) || 0;

  return (
    <div className="space-y-6">
      <div className="hidden sm:block">
        <h1 className="text-2xl font-black text-slate-900">Control Panel</h1>
        <p className="text-slate-500 text-sm">Reviewing current occupancy & collections.</p>
      </div>

      {/* Stats Cards - Grid Layout optimized for Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard label="Total Units" value={stats.totalSeats} icon={Armchair} color="indigo" trend="+5%" trendUp={true} />
        <StatCard label="Occupied" value={stats.liveOccupancy} icon={TrendingUp} color="emerald" trend={`${occupancyRate}%`} trendUp={true} />
        <StatCard label="Revenue" value={CURRENCY_FORMATTER.format(stats.totalRevenue)} icon={IndianRupee} color="amber" trend="+12%" trendUp={true} />
        <StatCard label="Total Dues" value={CURRENCY_FORMATTER.format(stats.totalDues)} icon={AlertCircle} color="rose" trend="-2%" trendUp={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Revenue Trend</h3>
          <div className="h-[220px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', fontSize: '12px'}} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[400px]">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Latest Logs</h3>
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {bookings.slice(-8).reverse().map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                  {b.studentName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-xs truncate">{b.studentName}</p>
                  <p className="text-[9px] text-slate-400">Seat {b.seatNumber} • {b.startDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-indigo-600 text-xs">₹{b.amount}</p>
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-slate-400 text-center py-6 text-xs italic">No records yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: any; color: string; trend: string; trendUp: boolean }> = ({ label, value, icon: Icon, color, trend, trendUp }) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className={`text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </div>
      </div>
      <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <h3 className="text-sm sm:text-lg font-black text-slate-900 mt-0.5 truncate">{value}</h3>
    </div>
  );
};

export default Dashboard;
