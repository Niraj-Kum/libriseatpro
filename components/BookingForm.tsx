import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, Booking, Settings, FeeStatus } from '../types';
import { DAYS } from '../constants';
import { X, Calendar, Clock, ChevronRight, Search, User, Check, IndianRupee, AlertCircle, Edit3, Repeat, Calculator, Info, UserPlus, Globe, MousePointer2, Sparkles } from 'lucide-react';
import { getSuggestedPrice } from '../services/geminiService';
import TimePicker from './TimePicker';

type DurationUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
type ActivationType = 'DAILY' | 'CUSTOM';

interface BookingFormProps {
  students: Student[];
  bookings: Booking[];
  settings: Settings;
  initialSeat?: number;
  initialDate?: string;
  initialBooking?: Booking;
  onClose: () => void;
  onSave: (booking: Booking) => void;
  onAddStudent: () => void;
}

const parseTimeToDate = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatTime = (date: Date): string => {
    return date.toTimeString().split(' ')[0].substring(0, 5);
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  students, 
  bookings,
  settings, 
  initialSeat, 
  initialDate, 
  initialBooking,
  onClose, 
  onSave,
  onAddStudent
}) => {
  const [studentId, setStudentId] = useState(initialBooking?.studentId || '');
  const [studentSearch, setStudentSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [seatNumber, setSeatNumber] = useState(initialBooking?.seatNumber || initialSeat || 1);
  const [startDate, setStartDate] = useState(initialBooking?.startDate || initialDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialBooking?.endDate || initialDate || new Date().toISOString().split('T')[0]);
  
  const [activationType, setActivationType] = useState<ActivationType>(
    initialBooking?.daysOfWeek.length === 7 ? 'DAILY' : 'CUSTOM'
  );

  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('MONTH');
  
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialBooking?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]
  ); 
  
  const [startTime, setStartTime] = useState<Date>(parseTimeToDate(initialBooking?.startTime || '09:00'));
  const [endTime, setEndTime] = useState<Date>(parseTimeToDate(initialBooking?.endTime || '11:00'));
  
  const [totalAmount, setTotalAmount] = useState(initialBooking?.amount || 0);
  const [paidAmount, setPaidAmount] = useState(initialBooking?.paidAmount || 0);

  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.id.toLowerCase().includes(query)
    );
  }, [students, studentSearch]);

  const selectedStudent = useMemo(() => 
    students.find(s => s.id === studentId), 
  [students, studentId]);

  useEffect(() => {
    if (selectedStudent && selectedStudent.defaultPrice) {
      setTotalAmount(selectedStudent.defaultPrice);
    } else if (selectedStudent) {
        setTotalAmount(0);
    }
  }, [selectedStudent]);

  const getDayIndex = (dateStr: string) => new Date(dateStr).getDay();

  useEffect(() => {
    const start = new Date(startDate);
    let end = new Date(startDate);

    switch (durationUnit) {
      case 'DAY': end.setDate(start.getDate() + (durationValue - 1)); break;
      case 'WEEK': end.setDate(start.getDate() + (durationValue * 7) - 1); break;
      case 'MONTH': end.setMonth(start.getMonth() + durationValue); end.setDate(end.getDate() - 1); break;
      case 'YEAR': end.setFullYear(start.getFullYear() + durationValue); end.setDate(end.getDate() - 1); break;
    }
    setEndDate(end.toISOString().split('T')[0]);
  }, [startDate, durationValue, durationUnit]);

  useEffect(() => {
    if (activationType === 'DAILY') {
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    } else {
      const startDayIdx = getDayIndex(startDate);
      setDaysOfWeek(prev => {
        if (!prev.includes(startDayIdx)) return [...prev, startDayIdx].sort();
        return prev;
      });
    }
  }, [activationType, startDate]);

  const handleDaysChange = (dayIdx: number) => {
    if (activationType === 'DAILY') return;
    if (dayIdx === getDayIndex(startDate)) return;
    setDaysOfWeek(prev => prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx].sort());
  };

  const handleSuggestPrice = async () => {
    if (!selectedStudent) return;
    setIsSuggesting(true);
    const price = await getSuggestedPrice(selectedStudent, bookings);
    if (price) {
      setSuggestedPrice(price);
      setTotalAmount(price);
    }
    setIsSuggesting(false);
  };

  const dueAmount = Math.max(0, totalAmount - paidAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return alert("Select a student first");
    
    let feeStatus: FeeStatus = 'Due';
    if (paidAmount >= totalAmount && totalAmount > 0) feeStatus = 'Paid';
    else if (paidAmount > 0) feeStatus = 'Partial';

    onSave({
      id: initialBooking?.id || Math.random().toString(36).substr(2, 9),
      studentId,
      studentName: selectedStudent?.name || 'Unknown',
      seatNumber,
      startDate,
      endDate,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      daysOfWeek,
      amount: totalAmount,
      paidAmount,
      feeStatus,
      createdAt: initialBooking?.createdAt || new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-[80] flex flex-col lg:bg-slate-900/60 lg:backdrop-blur-sm lg:items-center lg:justify-center lg:p-4">
      <div className="bg-white w-full h-full lg:h-auto lg:max-w-3xl lg:rounded-[2.5rem] lg:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Mobile Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${initialBooking ? 'bg-amber-500' : 'bg-indigo-600'}`}>
              {initialBooking ? <Edit3 className="w-5 h-5" /> : <Calculator className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">{initialBooking ? 'Modify' : 'New Entry'}</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">Seat Unit #{seatNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200/50 rounded-full text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Identity Section */}
          <section className="space-y-4">
            <div className="relative" ref={dropdownRef}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Member</label>
                <button type="button" onClick={onAddStudent} className="text-[10px] font-black text-indigo-600">+ REGISTER NEW</button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text"
                  placeholder={selectedStudent ? selectedStudent.name : "Search directory..."}
                  value={studentSearch}
                  onChange={(e) => { setStudentSearch(e.target.value); setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none"
                />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto">
                  {filteredStudents.map(s => (
                    <button key={s.id} type="button" onClick={() => { setStudentId(s.id); setStudentSearch(''); setIsDropdownOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 text-left ${studentId === s.id ? 'bg-indigo-50' : ''}`}>
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-[10px]">{s.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-900 truncate">{s.name}</p></div>
                      {studentId === s.id && <Check className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Time Config */}
          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Duration</label>
                  <input type="number" value={durationValue} onChange={e => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-black text-center" />
                </div>
                <div className="flex-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Duration Type</label>
                  <select value={durationUnit} onChange={e => setDurationUnit(e.target.value as DurationUnit)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-[10px] font-black text-center appearance-none">
                    <option value="DAY">DAY</option>
                    <option value="WEEK">WEEK</option>
                    <option value="MONTH">MONTH</option>
                    <option value="YEAR">YEAR</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[9px] font-black text-slate-400 uppercase">Daily Time Window</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                    <TimePicker selected={startTime} onChange={setStartTime} />
                </div>
                <span className="text-slate-300 font-bold">→</span>
                <div className="flex-1">
                    <TimePicker selected={endTime} onChange={setEndTime} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <label className="text-[9px] font-black text-slate-400 uppercase">Active Days</label>
                 <div className="flex gap-1 bg-slate-200 p-0.5 rounded-lg">
                   <button type="button" onClick={() => setActivationType('DAILY')} className={`px-2 py-1 rounded-md text-[8px] font-black ${activationType === 'DAILY' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>DAILY</button>
                   <button type="button" onClick={() => setActivationType('CUSTOM')} className={`px-2 py-1 rounded-md text-[8px] font-black ${activationType === 'CUSTOM' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>CUSTOM</button>
                 </div>
              </div>
              <div className="flex justify-between">
                {DAYS.map((day, idx) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDaysChange(idx)}
                    disabled={activationType === 'DAILY'}
                    className={`w-8 h-8 rounded-lg text-[9px] font-black border transition-all ${
                      daysOfWeek.includes(idx) ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-300 border-slate-200'
                    }`}
                  >
                    {day.charAt(0)}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing Config */}
          <section className="bg-indigo-600 rounded-2xl p-5 text-white space-y-5">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Price & Advance</p>
              <button type="button" onClick={handleSuggestPrice} disabled={isSuggesting || !selectedStudent} className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-2 rounded-lg disabled:opacity-50">
                <Sparkles className="w-4 h-4" /> {isSuggesting ? 'Thinking...' : 'Suggest Price'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-black uppercase text-indigo-200 mb-1">Total Amount</label>
                <input type="number" value={totalAmount} onChange={e => setTotalAmount(parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white font-black text-sm" />
              </div>
              <div>
                <label className="block text-[8px] font-black uppercase text-indigo-200 mb-1">Paid Amount</label>
                <input type="number" value={paidAmount} onChange={e => setPaidAmount(parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white font-black text-sm" />
              </div>
            </div>

            {suggestedPrice && (
              <p className="text-center text-xs text-indigo-200">AI Suggestion: ₹{suggestedPrice}</p>
            )}

            {dueAmount > 0 && (
               <div className="bg-rose-500/20 p-2 rounded-lg text-center">
                 <p className="text-[9px] font-bold text-rose-200 uppercase">Outstanding: ₹{dueAmount}</p>
               </div>
            )}
          </section>

          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 active:scale-95 transition-transform">
            Confirm Entry
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
