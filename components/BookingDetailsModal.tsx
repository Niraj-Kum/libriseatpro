
import React, { useEffect } from 'react';
import { X, User, Armchair, Calendar, Clock, CreditCard, Info, Edit2 } from 'lucide-react';
import { Booking } from '../types';
import { CURRENCY_FORMATTER, DAYS } from '../constants';

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
  onEdit: (booking: Booking) => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose, onEdit }) => {
  const selectedDays = booking.daysOfWeek.map(d => DAYS[d]).join(', ');

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-50 border-b border-slate-100 p-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Armchair className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Seat #{booking.seatNumber}</h2>
              <p className="text-slate-500 text-sm font-medium">Booking ID: {booking.id.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onEdit(booking)}
              className="p-3 hover:bg-indigo-50 text-indigo-600 rounded-full transition-colors"
              title="Edit Booking"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Student Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <User className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-widest text-xs">Student Information</h3>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-lg font-bold text-slate-900">{booking.studentName}</p>
              <p className="text-sm text-slate-500 mt-1">Student ID: {booking.studentId}</p>
            </div>
          </section>

          {/* Schedule Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Calendar className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-widest text-xs">Schedule Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Duration</p>
                <p className="text-sm font-bold text-slate-800">{booking.startDate}</p>
                <p className="text-xs text-slate-500">to {booking.endDate}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Time Slot</p>
                <p className="text-sm font-bold text-slate-800">{booking.startTime} - {booking.endTime}</p>
                <p className="text-xs text-slate-500">Daily Window</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Active Days</p>
              <p className="text-sm font-bold text-slate-800">{selectedDays}</p>
            </div>
          </section>

          {/* Financials */}
          <section className="space-y-4 pb-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-widest text-xs">Payment Status</h3>
            </div>
            <div className="flex items-center justify-between bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
              <div>
                <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Amount Summary</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-700">{CURRENCY_FORMATTER.format(booking.paidAmount)}</span>
                  <span className="text-xs text-indigo-400 font-medium">paid of {CURRENCY_FORMATTER.format(booking.amount)}</span>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                booking.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                booking.feeStatus === 'Due' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
                {booking.feeStatus}
              </span>
            </div>
            {booking.amount - booking.paidAmount > 0 && (
              <div className="flex items-center gap-2 px-2">
                <Info className="w-4 h-4 text-rose-500" />
                <p className="text-sm font-semibold text-rose-600">Outstanding Balance: {CURRENCY_FORMATTER.format(booking.amount - booking.paidAmount)}</p>
              </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onEdit(booking)}
              className="bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Edit2 className="w-5 h-5" /> Edit
            </button>
            <button 
              onClick={onClose}
              className="bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
