
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
  BarChart, 
  Bar, 
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
  // Generate sample revenue data for the chart
  const revenueData = [
    { name: 'Mon', revenue: 4500 },
    { name: 'Tue', revenue: 5200 },
    { name: 'Wed', revenue: 3800 },
    { name: 'Thu', revenue: 6100 },
    { name: 'Fri', revenue: 4900 },
    { name: 'Sat', revenue: 7200 },
    { name: 'Sun', revenue: 5800 },
  ];

  const occupancyRate = Math.round((stats.liveOccupancy / stats.totalSeats) * 100) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Management Overview</h1>
          <p className="text-slate-500">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 text-sm text-slate-600 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live System Active
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Seats" 
          value={stats.totalSeats} 
          icon={Armchair} 
          color="indigo" 
          trend="+5%"
          trendUp={true}
        />
        <StatCard 
          label="Live Occupancy" 
          value={`${stats.liveOccupancy} (${occupancyRate}%)`} 
          icon={TrendingUp} 
          color="emerald" 
          trend="Peak"
          trendUp={true}
        />
        <StatCard 
          label="Total Revenue" 
          value={CURRENCY_FORMATTER.format(stats.totalRevenue)} 
          icon={IndianRupee} 
          color="amber" 
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          label="Total Dues" 
          value={CURRENCY_FORMATTER.format(stats.totalDues)} 
          icon={AlertCircle} 
          color="rose" 
          trend="-2%"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-800">Weekly Revenue</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg">Last 7 Days</button>
              <button className="px-3 py-1 text-xs font-semibold text-slate-400 hover:text-slate-600">30 Days</button>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  formatter={(value: number) => CURRENCY_FORMATTER.format(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Latest Bookings</h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
            {bookings.slice(-5).reverse().map((b, i) => (
              <div key={b.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                  {b.studentName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{b.studentName}</p>
                  <p className="text-xs text-slate-500">Seat {b.seatNumber} • {b.startDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600 text-sm">₹{b.amount}</p>
                  <p className={`text-[10px] uppercase tracking-wider font-bold ${
                    b.feeStatus === 'Paid' ? 'text-green-500' : 'text-amber-500'
                  }`}>
                    {b.feeStatus}
                  </p>
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-slate-400 text-center py-10">No recent bookings found.</p>}
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
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
  );
};

export default Dashboard;
