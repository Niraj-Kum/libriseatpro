
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SeatMap from './components/SeatMap';
import TimelineView from './components/TimelineView';
import BookingForm from './components/BookingForm';
import StudentForm from './components/StudentForm';
import BookingDetailsModal from './components/BookingDetailsModal';
import AIInsights from './components/AIInsights';
import { Student, Booking, Settings, DashboardStats, FeeStatus } from './types';
import { dbService } from './services/dbService';
import { 
  Plus, Search, ChevronRight, Settings as SettingsIcon, Filter, AlertCircle, CheckCircle2, 
  Download, Upload, Trash2, Info, Loader2, CloudUpload, CloudOff, Wifi, WifiOff
} from 'lucide-react';
import { CURRENCY_FORMATTER } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCloudActive, setIsCloudActive] = useState(false);

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | undefined>();
  const [preSelectedDate, setPreSelectedDate] = useState<string | undefined>();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showOnlyDues, setShowOnlyDues] = useState(false);
  const [studentSortBy, setStudentSortBy] = useState<'name' | 'dues' | 'paid'>('name');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<FeeStatus | 'All'>('All');

  useEffect(() => {
    dbService.setConnectionCallback((active) => setIsCloudActive(active));

    const init = async () => {
      // Fetch settings first (local or cloud)
      const initialSettings = await dbService.getSettings();
      setSettings(initialSettings);
      
      const unsubscribeStudents = dbService.subscribeToStudents(setStudents);
      const unsubscribeBookings = dbService.subscribeToBookings((data) => {
        setBookings(data);
        setIsDataLoaded(true);
      });

      // Force-proceed if taking too long (e.g., stuck on permission denied)
      const timeout = setTimeout(() => {
        if (!isDataLoaded) setIsDataLoaded(true);
      }, 5000);

      return () => {
        unsubscribeStudents();
        unsubscribeBookings();
        clearTimeout(timeout);
      };
    };

    init();
  }, []);

  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDayIdx = now.getDay();

    const liveOccupancy = bookings.filter(b => {
      return b.startDate <= todayStr && b.endDate >= todayStr &&
             b.daysOfWeek.includes(currentDayIdx) &&
             currentTime >= b.startTime && currentTime <= b.endTime;
    }).length;

    const totalRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
    const totalDues = bookings.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);

    return { totalSeats: settings?.totalSeats || 40, liveOccupancy, totalRevenue, totalDues };
  }, [bookings, settings]);

  const studentSummaries = useMemo(() => {
    return students.map(student => {
      const studentBookings = bookings.filter(b => b.studentId === student.id);
      const totalAmount = studentBookings.reduce((sum, b) => sum + b.amount, 0);
      const totalPaid = studentBookings.reduce((sum, b) => sum + b.paidAmount, 0);
      const totalDues = totalAmount - totalPaid;
      return { ...student, totalAmount, totalPaid, totalDues, bookingCount: studentBookings.length };
    });
  }, [students, bookings]);

  const filteredStudentsView = useMemo(() => {
    let result = studentSummaries.filter(s => 
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
      s.id.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
    if (showOnlyDues) result = result.filter(s => s.totalDues > 0);
    result.sort((a, b) => {
      if (studentSortBy === 'name') return a.name.localeCompare(b.name);
      if (studentSortBy === 'dues') return b.totalDues - a.totalDues;
      if (studentSortBy === 'paid') return b.totalPaid - a.totalPaid;
      return 0;
    });
    return result;
  }, [studentSummaries, studentSearchQuery, showOnlyDues, studentSortBy]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        b.studentName.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
        b.seatNumber.toString() === bookingSearchQuery ||
        b.id.toLowerCase().includes(bookingSearchQuery.toLowerCase());
      const matchesStatus = bookingStatusFilter === 'All' || b.feeStatus === bookingStatusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }, [bookings, bookingSearchQuery, bookingStatusFilter]);

  const handleSaveBooking = async (bookingPayload: Booking) => {
    setIsProcessing(true);
    try {
      await dbService.saveBooking(bookingPayload);
      setShowBookingForm(false);
      setEditingBooking(null);
      setSelectedSeat(undefined);
      setPreSelectedDate(undefined);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveStudent = async (newStudent: Student) => {
    setIsProcessing(true);
    try {
      await dbService.saveStudent(newStudent);
      setShowStudentForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure? This will delete associated data locally and on cloud if connected.")) {
      setIsProcessing(true);
      try {
        await dbService.deleteStudent(id);
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSeatClick = (seat: number) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const occupantMap = dbService.getOccupancyStatus(bookings, todayStr, currentTime);
    const occupant = occupantMap.get(seat);

    if (occupant) {
      setViewingBooking(occupant);
    } else {
      setSelectedSeat(seat);
      setPreSelectedDate(undefined);
      setEditingBooking(null);
      setShowBookingForm(true);
    }
  };

  const handleLogout = () => setIsLoggedIn(false);
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authEmail && authPass) setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-xl shadow-indigo-900/40">
              <CheckCircle2 className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">LibriSeat Pro</h1>
            <p className="text-slate-400 font-medium tracking-tight">Enterprise Seat Management</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <input type="email" placeholder="Admin Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none text-black font-semibold" required />
              <input type="password" placeholder="Password" value={authPass} onChange={e => setAuthPass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none text-black font-semibold" required />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]">
              Open Control Panel
            </button>
          </form>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Cloud Persistence Ready
          </div>
        </div>
      </div>
    );
  }

  if (!isDataLoaded || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
          <CloudUpload className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-900">Establishing Database Link</h2>
          <p className="text-slate-500 text-sm animate-pulse-soft">Validating cloud permissions & synchronizing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onLogout={handleLogout} 
        onAddStudent={() => setShowStudentForm(true)}
      />

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {/* Connection Status Bar */}
        <div className="max-w-7xl mx-auto mb-6 flex justify-end">
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 transition-all ${
            isCloudActive ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
            {isCloudActive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isCloudActive ? 'Cloud Synchronized' : 'Local Storage Mode (Permissions Locked)'}
            </span>
          </div>
        </div>

        {isProcessing && (
           <div className="fixed top-6 right-6 z-[120] bg-white px-6 py-3 rounded-2xl shadow-2xl border border-indigo-100 flex items-center gap-3 animate-in slide-in-from-right-4">
             <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
             <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Applying Changes...</span>
           </div>
        )}

        {!isCloudActive && (
          <div className="max-w-7xl mx-auto mb-8 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 text-amber-800 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-medium">
              Firestore reports <b>Permission Denied</b>. Check your Firebase security rules. System is currently running on <b>LocalStorage</b> to prevent data loss.
            </p>
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-8 pb-10">
          {currentView === 'dashboard' && (
            <div className="space-y-8">
              <Dashboard stats={stats} bookings={bookings} />
              <AIInsights bookings={bookings} totalRevenue={stats.totalRevenue} totalDues={stats.totalDues} />
            </div>
          )}

          {currentView === 'seatmap' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">Floor Inventory</h1>
                  <p className="text-slate-500 text-sm">Real-time unit availability • {settings.totalSeats} seats</p>
                </div>
                <button onClick={() => { setEditingBooking(null); setShowBookingForm(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-[2rem] font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-100">
                  <Plus className="w-5 h-5" /> Quick Booking
                </button>
              </div>
              <SeatMap bookings={bookings} settings={settings} onSeatClick={handleSeatClick} />
            </div>
          )}

          {currentView === 'timeline' && (
            <TimelineView bookings={bookings} settings={settings} onCellClick={(seat, date) => { setSelectedSeat(seat); setPreSelectedDate(date); setShowBookingForm(true); }} onBookingClick={setViewingBooking} />
          )}

          {currentView === 'bookings' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-black text-slate-900">Active Schedules</h1>
                  <div className="flex gap-4">
                    <div className="bg-white border border-slate-200 rounded-[1.5rem] px-5 py-3 flex items-center gap-3 w-72 shadow-sm">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Search entries..." className="text-sm outline-none text-black w-full font-medium" value={bookingSearchQuery} onChange={(e) => setBookingSearchQuery(e.target.value)} />
                    </div>
                  </div>
               </div>
               <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100">
                     <tr>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seat</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Period</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valuation</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {filteredBookings.map(b => (
                       <tr key={b.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => setViewingBooking(b)}>
                         <td className="px-8 py-5">
                           <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{b.studentName}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.id}</p>
                         </td>
                         <td className="px-8 py-5">
                           <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">{b.seatNumber}</div>
                         </td>
                         <td className="px-8 py-5 text-sm text-slate-600 font-medium">
                           {b.startDate} <span className="text-slate-300 mx-1">→</span> {b.endDate}
                           <p className="text-[10px] text-slate-400 font-bold">{b.startTime} - {b.endTime}</p>
                         </td>
                         <td className="px-8 py-5 font-black text-slate-900">{CURRENCY_FORMATTER.format(b.amount)}</td>
                         <td className="px-8 py-5">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             b.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                           }`}>{b.feeStatus}</span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {currentView === 'students' && (
             <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900">Member Directory</h1>
                    <p className="text-slate-500 text-sm">{students.length} registered profiles</p>
                  </div>
                  <button onClick={() => setShowStudentForm(true)} className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-bold hover:bg-black transition-all flex items-center gap-2 shadow-xl">
                    <Plus className="w-5 h-5" /> New Member
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStudentsView.map(s => (
                    <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group">
                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">{s.name.charAt(0)}</div>
                        <div className="flex-1">
                          <h3 className="font-black text-slate-900 text-lg leading-tight">{s.name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.id}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteStudent(s.id); }} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Dues</p>
                            <p className={`text-sm font-black ${s.totalDues > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{CURRENCY_FORMATTER.format(s.totalDues)}</p>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Bookings</p>
                            <p className="text-sm font-black text-slate-900">{s.bookingCount}</p>
                         </div>
                      </div>
                      <button className="w-full py-4 border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all">View Cloud History</button>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {currentView === 'settings' && (
             <div className="max-w-3xl space-y-10">
                <section className="space-y-6">
                  <h1 className="text-3xl font-black text-slate-900">System Configuration</h1>
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-slate-900">Library Capacity</h3>
                        <p className="text-sm text-slate-500">Total physical seats available in floor inventory</p>
                      </div>
                      <input type="number" value={settings.totalSeats} onChange={e => setSettings({...settings, totalSeats: parseInt(e.target.value) || 1})} className="w-24 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-center font-black text-lg text-black font-semibold" />
                    </div>
                    <div className="pt-8 border-t border-slate-100 flex justify-end">
                      <button onClick={async () => { 
                        setIsProcessing(true);
                        await dbService.saveSettings(settings); 
                        setIsProcessing(false);
                        alert("Settings updated!"); 
                      }} className="bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] font-bold hover:bg-black transition-all shadow-xl shadow-slate-200">Save Environment</button>
                    </div>
                  </div>
                </section>
             </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {showBookingForm && (
        <BookingForm 
          students={students} 
          settings={settings} 
          initialSeat={selectedSeat} 
          initialDate={preSelectedDate} 
          initialBooking={editingBooking || undefined} 
          onClose={() => { setShowBookingForm(false); setEditingBooking(null); setSelectedSeat(undefined); }} 
          onSave={handleSaveBooking}
          onAddStudent={() => setShowStudentForm(true)}
        />
      )}
      {showStudentForm && <StudentForm onClose={() => setShowStudentForm(false)} onSave={handleSaveStudent} />}
      {viewingBooking && <BookingDetailsModal booking={viewingBooking} onClose={() => setViewingBooking(null)} onEdit={(b) => { setViewingBooking(null); setEditingBooking(b); setShowBookingForm(true); }} />}
    </div>
  );
};

export default App;
