
import React, { useState } from 'react';
import { Booking, Settings } from '../types';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineViewProps {
  bookings: Booking[];
  settings: Settings;
  onCellClick: (seat: number, date: string) => void;
  onBookingClick: (booking: Booking) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ bookings, settings, onCellClick, onBookingClick }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

  const getOccupancyAt = (seat: number, hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const dayOfWeek = new Date(selectedDate).getDay();
    
    return bookings.find(b => 
      b.seatNumber === seat &&
      b.startDate <= selectedDate &&
      b.endDate >= selectedDate &&
      b.daysOfWeek.includes(dayOfWeek) &&
      timeStr >= b.startTime &&
      timeStr <= b.endTime
    );
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Seat Timeline</h2>
          <p className="text-slate-500">Visualizing hourly occupancy for {selectedDate}</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <Calendar className="w-5 h-5 text-indigo-500 ml-2" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-black font-semibold outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
        <div className="min-w-[1200px]">
          {/* Header */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            <div className="w-24 p-4 font-bold text-slate-400 text-xs border-r border-slate-100 sticky left-0 bg-slate-50 z-10 uppercase tracking-widest">
              Seat
            </div>
            {hours.map(h => (
              <div key={h} className="flex-1 p-4 text-center font-bold text-slate-600 text-sm min-w-[80px]">
                {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="max-h-[60vh] overflow-y-auto">
            {Array.from({ length: settings.totalSeats }, (_, i) => i + 1).map(seatNum => (
              <div key={seatNum} className="flex border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                <div className="w-24 p-4 font-bold text-slate-700 text-sm border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10 flex items-center justify-center">
                  #{seatNum}
                </div>
                {hours.map(h => {
                  const booking = getOccupancyAt(seatNum, h);
                  return (
                    <div key={h} className="flex-1 p-1 min-w-[80px] h-16">
                      {booking ? (
                        <button 
                          onClick={() => onBookingClick(booking)}
                          className="w-full h-full rounded-xl flex items-center justify-center text-[10px] p-1 text-center font-bold shadow-sm border bg-indigo-600 text-white border-indigo-700 animate-in fade-in zoom-in duration-200 hover:bg-indigo-700 transition-colors"
                          title={`${booking.studentName} (${booking.feeStatus})`}
                        >
                          {booking.studentName.split(' ')[0]}
                        </button>
                      ) : (
                        <button 
                          onClick={() => onCellClick(seatNum, selectedDate)}
                          className="w-full h-full rounded-xl flex items-center justify-center text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-tighter hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
