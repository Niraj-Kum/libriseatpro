
import React, { useState, useMemo } from 'react';
import { Booking, Settings } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Info } from 'lucide-react';

interface TimelineViewProps {
  bookings: Booking[];
  settings: Settings;
  onCellClick: (seat: number, date: string) => void;
  onBookingClick: (booking: Booking) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ bookings, settings, onCellClick, onBookingClick }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 7 AM to 10 PM coverage
  const hours = useMemo(() => Array.from({ length: 16 }, (_, i) => i + 7), []);

  const now = new Date();
  const isSelectedToday = selectedDate === now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const getOccupancyAt = (seat: number, hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const dayOfWeek = new Date(selectedDate).getDay();
    
    return bookings.find(b => 
      b.seatNumber === seat &&
      b.startDate <= selectedDate &&
      b.endDate >= selectedDate &&
      b.daysOfWeek.includes(dayOfWeek) &&
      timeStr >= b.startTime &&
      timeStr < b.endTime
    );
  };

  const getTimePeriod = (hour: number) => {
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[75vh] lg:h-[80vh] animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Daily Seat Map
          </h2>
          <p className="text-slate-500 text-xs font-medium">Coordinate hourly shifts for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-slate-900 font-bold text-sm outline-none cursor-pointer"
            />
          </div>

          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend & Period Labels */}
      <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Available</span>
          </div>
        </div>
        {isSelectedToday && (
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">LIVE NOW: {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
          </div>
        )}
      </div>

      {/* Main Grid Container */}
      <div className="flex-1 overflow-auto relative">
        <div className="min-w-[1400px]">
          {/* Timeline Header */}
          <div className="sticky top-0 z-30 flex bg-white border-b-2 border-slate-100">
            <div className="w-24 shrink-0 p-4 font-black text-slate-400 text-[10px] border-r border-slate-100 sticky left-0 bg-white uppercase tracking-[0.2em] flex items-center justify-center">
              Seat
            </div>
            {hours.map(h => (
              <div key={h} className="flex-1 min-w-[100px] border-r border-slate-50 last:border-r-0">
                <div className={`p-3 text-center transition-colors ${h === currentHour && isSelectedToday ? 'bg-indigo-50' : ''}`}>
                  <p className="font-black text-slate-800 text-xs">
                    {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                  </p>
                  <p className={`text-[8px] font-bold uppercase tracking-tighter ${h < 12 ? 'text-blue-400' : h < 17 ? 'text-amber-400' : 'text-indigo-400'}`}>
                    {getTimePeriod(h)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Seat Rows */}
          <div className="divide-y divide-slate-50">
            {Array.from({ length: settings.totalSeats }, (_, i) => i + 1).map(seatNum => (
              <div key={seatNum} className="flex group/row hover:bg-slate-50/50 transition-colors">
                <div className="w-24 shrink-0 p-4 font-black text-slate-700 text-sm border-r border-slate-100 sticky left-0 bg-white group-hover/row:bg-slate-50 z-20 flex items-center justify-center shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  <div className="bg-slate-100 w-10 h-10 rounded-xl flex items-center justify-center group-hover/row:bg-indigo-600 group-hover/row:text-white transition-all">
                    {seatNum}
                  </div>
                </div>
                
                {hours.map(h => {
                  const booking = getOccupancyAt(seatNum, h);
                  const isCurrentSlot = isSelectedToday && h === currentHour;
                  
                  return (
                    <div 
                      key={h} 
                      className={`flex-1 min-w-[100px] h-20 p-1.5 border-r border-slate-50 last:border-r-0 relative group/cell ${isCurrentSlot ? 'bg-indigo-50/20' : ''}`}
                    >
                      {booking ? (
                        <button 
                          onClick={() => onBookingClick(booking)}
                          className={`w-full h-full rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center shadow-sm border transition-all hover:scale-[1.02] hover:shadow-md ${
                            booking.feeStatus === 'Paid' 
                              ? 'bg-indigo-600 border-indigo-700 text-white' 
                              : 'bg-white border-rose-200 text-rose-600'
                          }`}
                        >
                          <span className="text-[10px] font-black truncate w-full px-1">{booking.studentName.split(' ')[0]}</span>
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${booking.feeStatus === 'Paid' ? 'bg-white/20' : 'bg-rose-50 text-rose-500'}`}>
                            {booking.startTime} - {booking.endTime}
                          </div>
                        </button>
                      ) : (
                        <button 
                          onClick={() => onCellClick(seatNum, selectedDate)}
                          className="w-full h-full rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-100 text-slate-300 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-500 transition-all group/btn"
                        >
                          <Plus className="w-4 h-4 mb-0.5 opacity-0 group-hover/btn:opacity-100 transition-all transform scale-75 group-hover/btn:scale-100" />
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/btn:opacity-100">Book</span>
                        </button>
                      )}

                      {/* Current time line (visual only) */}
                      {isCurrentSlot && (
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none"
                          style={{ left: `${(currentMinute / 60) * 100}%` }}
                        >
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-rose-500 rounded-full shadow-sm shadow-rose-200"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Info */}
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0 lg:rounded-b-3xl">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" />
          <p className="text-[10px] font-medium tracking-wide">Tip: Tap any empty slot to open the scheduler for that specific seat and hour.</p>
        </div>
        <div className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Operational Hours: 07:00 AM - 10:00 PM
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
