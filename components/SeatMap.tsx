
import React, { useMemo } from 'react';
import { Booking, Settings } from '../types';
import { Armchair, CheckCircle2, Clock } from 'lucide-react';

interface SeatMapProps {
  bookings: Booking[];
  settings: Settings;
  onSeatClick: (seat: number) => void;
}

const SeatMap: React.FC<SeatMapProps> = ({ bookings, settings, onSeatClick }) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const currentDayIdx = now.getDay();

  // Find active occupant for each seat right now
  const occupancyMap = useMemo(() => {
    const map = new Map<number, Booking>();
    bookings.forEach(b => {
      const isToday = b.startDate <= todayStr && b.endDate >= todayStr;
      const isDayActive = b.daysOfWeek.includes(currentDayIdx);
      const isTimeActive = currentTime >= b.startTime && currentTime <= b.endTime;
      
      if (isToday && isDayActive && isTimeActive) {
        map.set(b.seatNumber, b);
      }
    });
    return map;
  }, [bookings, todayStr, currentTime, currentDayIdx]);

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Floor Plan</h2>
          <p className="text-slate-500 text-sm">Real-time occupancy as of {currentTime}</p>
        </div>
        <div className="flex gap-6 text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-indigo-500"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200"></div>
            <span>Available</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
        {Array.from({ length: settings.totalSeats }, (_, i) => i + 1).map(num => {
          const occupant = occupancyMap.get(num);
          const isOccupied = !!occupant;

          return (
            <button
              key={num}
              onClick={() => onSeatClick(num)}
              className={`group relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 ${
                isOccupied 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'bg-slate-50 border border-slate-200 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
            >
              <Armchair className={`w-6 h-6 mb-1 ${isOccupied ? 'text-white' : 'text-slate-300 group-hover:text-indigo-400'}`} />
              <span className="text-xs font-bold">{num}</span>

              {/* Tooltip-like details on hover if occupied */}
              {isOccupied && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-slate-900 text-white p-3 rounded-xl text-[10px] invisible group-hover:visible z-10 shadow-xl">
                  <p className="font-bold text-xs mb-1">{occupant.studentName}</p>
                  <p className="opacity-70 flex items-center gap-1"><Clock className="w-3 h-3" /> {occupant.startTime} - {occupant.endTime}</p>
                  <p className="opacity-70 mt-1">Status: {occupant.feeStatus}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SeatMap;
