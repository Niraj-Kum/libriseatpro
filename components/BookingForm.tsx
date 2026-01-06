
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, Booking, Settings, FeeStatus } from '../types';
import { DAYS } from '../constants';
import { X, Calendar, Clock, CreditCard, ChevronRight, Search, User, Check, IndianRupee, AlertCircle, Edit3, Repeat, Calculator, Info, UserPlus, Globe, MousePointer2 } from 'lucide-react';

type DurationUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
type PricingModel = 'FLAT' | 'HOURLY';
type ActivationType = 'DAILY' | 'CUSTOM';

interface BookingFormProps {
  students: Student[];
  settings: Settings;
  initialSeat?: number;
  initialDate?: string;
  initialBooking?: Booking;
  onClose: () => void;
  onSave: (booking: Booking) => void;
  onAddStudent: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  students, 
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
  
  // Activation Type: Default to DAILY
  const [activationType, setActivationType] = useState<ActivationType>(
    initialBooking?.daysOfWeek.length === 7 ? 'DAILY' : 'CUSTOM'
  );

  // Duration & Pricing Config
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('MONTH');
  const [pricingModel, setPricingModel] = useState<PricingModel>('FLAT');
  
  // Default days: Daily includes everything 0-6
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialBooking?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]
  ); 
  
  const [unitPrice, setUnitPrice] = useState(settings.pricePerSession);
  const [hourlyRate, setHourlyRate] = useState(30);
  
  const [startTime, setStartTime] = useState(initialBooking?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialBooking?.endTime || '18:00');
  
  const [totalAmount, setTotalAmount] = useState(initialBooking?.amount || 0);
  const [paidAmount, setPaidAmount] = useState(initialBooking?.paidAmount || 0);

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

  const getDayIndex = (dateStr: string) => new Date(dateStr).getDay();

  // Calculation: Decimal Hours per Session
  const hoursPerSession = useMemo(() => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  }, [startTime, endTime]);

  // Calculation: Total Active Days (Sessions)
  const totalActiveDays = useMemo(() => {
    let count = 0;
    let current = new Date(startDate);
    const last = new Date(endDate);
    while (current <= last) {
      if (daysOfWeek.includes(current.getDay())) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }, [startDate, endDate, daysOfWeek]);

  // Sync End Date based on Duration Input
  useEffect(() => {
    const start = new Date(startDate);
    let end = new Date(startDate);

    switch (durationUnit) {
      case 'DAY':
        end.setDate(start.getDate() + (durationValue - 1));
        break;
      case 'WEEK':
        end.setDate(start.getDate() + (durationValue * 7) - 1);
        break;
      case 'MONTH':
        end.setMonth(start.getMonth() + durationValue);
        end.setDate(end.getDate() - 1);
        break;
      case 'YEAR':
        end.setFullYear(start.getFullYear() + durationValue);
        end.setDate(end.getDate() - 1);
        break;
    }

    setEndDate(end.toISOString().split('T')[0]);
  }, [startDate, durationValue, durationUnit]);

  // Final Pricing Engine
  useEffect(() => {
    if (pricingModel === 'FLAT') {
      setTotalAmount(durationValue * unitPrice);
    } else {
      const totalHours = totalActiveDays * hoursPerSession;
      setTotalAmount(Math.round(totalHours * hourlyRate));
    }
  }, [pricingModel, durationValue, unitPrice, totalActiveDays, hoursPerSession, hourlyRate]);

  // Sync Activation Type to Days
  useEffect(() => {
    if (activationType === 'DAILY') {
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    } else {
      // Ensure start day is always included in Custom
      const startDayIdx = getDayIndex(startDate);
      setDaysOfWeek(prev => {
        if (!prev.includes(startDayIdx)) return [...prev, startDayIdx].sort();
        return prev;
      });
    }
  }, [activationType, startDate]);

  const handleDaysChange = (dayIdx: number) => {
    if (activationType === 'DAILY') return; // Cannot change days in Daily mode
    if (dayIdx === getDayIndex(startDate)) return; // Anchor day
    
    setDaysOfWeek(prev => 
      prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx].sort()
    );
  };

  const dueAmount = Math.max(0, totalAmount - paidAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return alert("Please select a student");
    if (totalAmount <= 0) return alert("Total amount must be greater than zero.");
    
    let feeStatus: FeeStatus = 'Due';
    if (paidAmount >= totalAmount && totalAmount > 0) feeStatus = 'Paid';
    else if (paidAmount > 0) feeStatus = 'Partial';

    const bookingPayload: Booking = {
      id: initialBooking?.id || Math.random().toString(36).substr(2, 9),
      studentId,
      studentName: selectedStudent?.name || 'Unknown',
      seatNumber,
      startDate,
      endDate,
      startTime,
      endTime,
      daysOfWeek,
      amount: totalAmount,
      paidAmount,
      feeStatus,
      createdAt: initialBooking?.createdAt || new Date().toISOString()
    };

    onSave(bookingPayload);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${initialBooking ? 'bg-amber-500' : 'bg-indigo-600'}`}>
              {initialBooking ? <Edit3 className="w-6 h-6" /> : <Calculator className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{initialBooking ? 'Update Reservation' : 'Smart Pricing Engine'}</h2>
              <p className="text-slate-500 text-sm">Configuring Seat #{seatNumber} for {selectedStudent?.name || 'New Client'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[85vh] overflow-y-auto">
          {/* Step 1: Identity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600">
                <User className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest">Client & Asset</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative" ref={dropdownRef}>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Select Student</label>
                  <button 
                    type="button" 
                    onClick={onAddStudent}
                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors group"
                  >
                    <UserPlus className="w-3 h-3 group-hover:scale-110" />
                    CREATE NEW
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text"
                    placeholder={selectedStudent ? selectedStudent.name : "Search directory..."}
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none text-black font-semibold"
                  />
                </div>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setStudentId(s.id);
                            setStudentSearch('');
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left ${studentId === s.id ? 'bg-indigo-50/50' : ''}`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">{s.name.charAt(0)}</div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-black">{s.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">ID: {s.id}</p>
                          </div>
                          {studentId === s.id && <Check className="w-4 h-4 text-indigo-600" />}
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center space-y-4">
                        <p className="text-slate-400 text-sm">No match found.</p>
                        <button 
                          type="button"
                          onClick={onAddStudent}
                          className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                        >
                          Add "{studentSearch}" as New Student
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Seat ID</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={seatNumber}
                    onChange={e => setSeatNumber(parseInt(e.target.value))}
                    min="1"
                    max={settings.totalSeats}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                  />
                  <div className="bg-indigo-50 text-indigo-600 px-4 py-3 rounded-xl border border-indigo-100 flex items-center justify-center">
                    <Repeat className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Time Configuration */}
          <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-6">
            <div className="flex items-center gap-2 text-indigo-600">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">Time & Schedule</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Effective From</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Duration</label>
                <input 
                  type="number" 
                  value={durationValue}
                  onChange={e => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-black font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Unit</label>
                <select 
                  value={durationUnit}
                  onChange={e => setDurationUnit(e.target.value as DurationUnit)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-black font-semibold appearance-none"
                >
                  <option value="DAY">Days</option>
                  <option value="WEEK">Weeks</option>
                  <option value="MONTH">Months</option>
                  <option value="YEAR">Years</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Daily Window</label>
                <div className="flex items-center gap-3">
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-3 text-black text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                  <span className="text-slate-300">to</span>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-3 text-black text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                </div>
                <div className="flex items-center gap-2 px-1">
                  <Info className="w-3 h-3 text-indigo-400" />
                  <p className="text-[10px] text-slate-400 font-medium">{hoursPerSession.toFixed(1)} hours per active day</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly Activation</label>
                  <div className="bg-slate-200/50 p-1 rounded-full flex gap-1 border border-slate-200">
                    <button 
                      type="button" 
                      onClick={() => setActivationType('DAILY')}
                      className={`px-3 py-1 rounded-full text-[9px] font-black transition-all ${activationType === 'DAILY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      DAILY
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setActivationType('CUSTOM')}
                      className={`px-3 py-1 rounded-full text-[9px] font-black transition-all ${activationType === 'CUSTOM' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      CUSTOM
                    </button>
                  </div>
                </div>

                <div className="flex justify-between gap-1.5">
                  {DAYS.map((day, idx) => {
                    const isAnchor = getDayIndex(startDate) === idx;
                    const isSelected = daysOfWeek.includes(idx);
                    const isDaily = activationType === 'DAILY';
                    
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDaysChange(idx)}
                        disabled={isDaily}
                        className={`w-9 h-11 flex items-center justify-center rounded-xl text-[11px] font-black transition-all border relative group ${
                          isDaily ? 'bg-indigo-500 text-white border-indigo-600 opacity-90' :
                          isAnchor ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' :
                          isSelected ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 
                          'bg-white text-slate-300 border-slate-200 hover:border-indigo-300 hover:text-indigo-400'
                        }`}
                        title={isAnchor ? "Start date anchor" : isDaily ? "All days active" : day}
                      >
                        {day.substring(0, 1)}
                        {isAnchor && !isDaily && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-900 rounded-full border-2 border-white"></div>}
                        {isDaily && <div className="absolute inset-0 bg-indigo-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Globe className="w-3 h-3 text-white" />
                        </div>}
                      </button>
                    );
                  })}
                </div>
                {activationType === 'CUSTOM' && (
                  <p className="text-[9px] text-slate-400 italic px-1 flex items-center gap-1">
                    <MousePointer2 className="w-2.5 h-2.5" /> Toggle specific days for your session
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Step 3: Advanced Pricing */}
          <section className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
               <div className="space-y-1">
                 <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                   <IndianRupee className="w-5 h-5" /> Financial Summary
                 </h3>
                 <p className="text-indigo-200 text-xs">Bundle expires on <span className="text-white font-bold">{endDate}</span></p>
               </div>
               
               <div className="bg-white/10 rounded-2xl p-1 flex border border-white/20">
                 <button 
                  type="button"
                  onClick={() => setPricingModel('FLAT')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${pricingModel === 'FLAT' ? 'bg-white text-indigo-600 shadow-md' : 'text-indigo-100'}`}
                 >
                   BUNDLE
                 </button>
                 <button 
                  type="button"
                  onClick={() => setPricingModel('HOURLY')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${pricingModel === 'HOURLY' ? 'bg-white text-indigo-600 shadow-md' : 'text-indigo-100'}`}
                 >
                   HOURLY
                 </button>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">
                      {pricingModel === 'FLAT' ? `Rate per ${durationUnit.toLowerCase()}` : 'Rate per Hour'}
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <input 
                        type="number" 
                        value={pricingModel === 'FLAT' ? unitPrice : hourlyRate}
                        onChange={e => pricingModel === 'FLAT' ? setUnitPrice(parseInt(e.target.value) || 0) : setHourlyRate(parseInt(e.target.value) || 0)}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-white outline-none text-white font-black text-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">Advance Payment</label>
                    <input 
                      type="number" 
                      max={totalAmount}
                      value={paidAmount}
                      onChange={e => setPaidAmount(parseInt(e.target.value) || 0)}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-white outline-none text-white font-black text-xl"
                    />
                  </div>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center space-y-2">
                   <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Total Valuation</p>
                   <h4 className="text-5xl font-black">₹{totalAmount}</h4>
                   <div className="flex items-center gap-2 mt-2">
                     <span className="text-[10px] font-bold text-indigo-100 bg-white/10 px-2 py-1 rounded-md">
                        {pricingModel === 'FLAT' 
                          ? `${durationValue} x ₹${unitPrice}` 
                          : `${totalActiveDays} days x ${hoursPerSession.toFixed(1)}h x ₹${hourlyRate}`}
                     </span>
                   </div>
                </div>
             </div>

             {dueAmount > 0 && (
               <div className="bg-rose-500/20 border border-rose-500/30 p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-bottom-2">
                 <div className="flex items-center gap-2">
                   <AlertCircle className="w-4 h-4 text-rose-300" />
                   <span className="text-xs font-bold text-indigo-50">Pending Due Amount:</span>
                 </div>
                 <span className="text-xl font-black text-rose-300">₹{dueAmount}</span>
               </div>
             )}
          </section>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-bold text-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 group"
          >
            {initialBooking ? 'Save Modifications' : 'Finalize Reservation'} 
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
