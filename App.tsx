
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
  Plus, Search, CheckCircle2, 
  Loader2, Database, ShieldCheck, Trash2, Library, LogOut
} from 'lucide-react';
import { CURRENCY_FORMATTER } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    const init = async () => {
      const initialSettings = await dbService.getSettings();
      setSettings(initialSettings);
      
      const unsubscribeStudents = dbService.subscribeToStudents(setStudents);
      const unsubscribeBookings = dbService.subscribeToBookings((data) => {
        setBookings(data);
        setIsDataLoaded(true);
      });

      return () => {
        unsubscribeStudents();
        unsubscribeBookings();
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
    await dbService.saveBooking(bookingPayload);
    setShowBookingForm(false);
    setEditingBooking(null);
    setSelectedSeat(undefined);
    setPreSelectedDate(undefined);
    setIsProcessing(false);
  };

  const handleSaveStudent = async (newStudent: Student) => {
    setIsProcessing(true);
    await dbService.saveStudent(newStudent);
    setShowStudentForm(false);
    setIsProcessing(false);
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure? This will delete the student and all their associated bookings.")) {
      setIsProcessing(true);
      await dbService.deleteStudent(id);
      setIsProcessing(false);
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
        <div className="bg-white p-10 rounded-[2rem] w-full max-w-md shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">LibriSeat Pro</h1>
            <p className="text-slate-400 font-medium">Mobile Library Console</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <input type="email" placeholder="Admin Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none text-black" required />
              <input type="password" placeholder="Password" value={authPass} onChange={e => setAuthPass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none text-black" required />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isDataLoaded || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold">Syncing Records</h2>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col lg:flex-row">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onLogout={handleLogout} 
        onAddStudent={() => setShowStudentForm(true)}
      />

      <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 lg:h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Library className="text-indigo-600 w-5 h-5" />
            <span className="font-black text-slate-900 uppercase tracking-tight">LibriSeat</span>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowStudentForm(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
               <Plus className="w-5 h-5" />
             </button>
             <button onClick={handleLogout} className="p-2 text-slate-400">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
          {/* Status Badge - Hidden on very small screens or moved */}
          <div className="hidden sm:flex justify-end">
            <div className="px-3 py-1.5 rounded-full border bg-emerald-50 border-emerald-100 text-emerald-600 flex items-center gap-2">
              <Database className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Local Mode</span>
            </div>
          </div>

          {isProcessing && (
            <div className="fixed top-20 right-4 lg:top-6 lg:right-6 z-[120] bg-white px-4 py-2 rounded-xl shadow-xl border border-indigo-100 flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
              <span className="text-[10px] font-black">Syncing...</span>
            </div>
          )}

          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <Dashboard stats={stats} bookings={bookings} />
              <AIInsights bookings={bookings} totalRevenue={stats.totalRevenue} totalDues={stats.totalDues} />
            </div>
          )}

          {currentView === 'seatmap' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Floor Layout</h1>
                  <p className="text-slate-500 text-xs">Real-time seat availability</p>
                </div>
                <button onClick={() => { setEditingBooking(null); setShowBookingForm(true); }} className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Quick Book
                </button>
              </div>
              <SeatMap bookings={bookings} settings={settings} onSeatClick={handleSeatClick} />
            </div>
          )}

          {currentView === 'timeline' && (
            <TimelineView bookings={bookings} settings={settings} onCellClick={(seat, date) => { setSelectedSeat(seat); setPreSelectedDate(date); setShowBookingForm(true); }} onBookingClick={setViewingBooking} />
          )}

          {currentView === 'bookings' && (
            <div className="space-y-6">
               <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                  <h1 className="text-2xl font-black text-slate-900">Active Ledger</h1>
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 w-full sm:w-72 shadow-sm">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search..." className="text-sm outline-none text-black w-full" value={bookingSearchQuery} onChange={(e) => setBookingSearchQuery(e.target.value)} />
                  </div>
               </div>
               
               {/* Table for Desktop, Cards for Mobile */}
               <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                 <div className="hidden sm:block">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b border-slate-100">
                       <tr>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {filteredBookings.map(b => (
                         <tr key={b.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setViewingBooking(b)}>
                           <td className="px-6 py-4">
                             <p className="font-bold text-slate-900">{b.studentName}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase">{b.startDate}</p>
                           </td>
                           <td className="px-6 py-4">
                             <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">#{b.seatNumber}</div>
                           </td>
                           <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                               b.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                             }`}>{b.feeStatus}</span>
                           </td>
                           <td className="px-6 py-4 text-right font-black text-slate-900">{CURRENCY_FORMATTER.format(b.amount)}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
                 <div className="sm:hidden divide-y divide-slate-100">
                   {filteredBookings.map(b => (
                     <div key={b.id} className="p-4 active:bg-slate-50 flex justify-between items-center" onClick={() => setViewingBooking(b)}>
                       <div>
                         <p className="font-bold text-slate-900">{b.studentName}</p>
                         <p className="text-[10px] text-slate-400 font-bold">Seat #{b.seatNumber} • {b.startDate}</p>
                       </div>
                       <div className="text-right">
                         <p className="font-black text-slate-900 text-sm">{CURRENCY_FORMATTER.format(b.amount)}</p>
                         <span className={`text-[8px] font-black uppercase ${b.feeStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>{b.feeStatus}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {currentView === 'students' && (
             <div className="space-y-6">
                <h1 className="text-2xl font-black text-slate-900">Members</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredStudentsView.map(s => (
                    <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">{s.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">{s.name}</h3>
                          <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{s.id}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteStudent(s.id); }} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Dues</p>
                          <p className={`text-xs font-black ${s.totalDues > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{CURRENCY_FORMATTER.format(s.totalDues)}</p>
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Count</p>
                          <p className="text-xs font-black text-slate-900">{s.bookingCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {currentView === 'settings' && (
             <div className="max-w-2xl space-y-6">
                <h1 className="text-2xl font-black text-slate-900">System</h1>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">Library Capacity</h3>
                      <p className="text-[10px] text-slate-500">Max seats available</p>
                    </div>
                    <input type="number" value={settings.totalSeats} onChange={e => setSettings({...settings, totalSeats: parseInt(e.target.value) || 1})} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-center font-bold text-black" />
                  </div>
                  <button onClick={async () => { 
                    setIsProcessing(true);
                    await dbService.saveSettings(settings); 
                    setIsProcessing(false);
                    alert("Saved locally"); 
                  }} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold">Update Preferences</button>
                </div>
             </div>
          )}
        </div>
      </main>

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
