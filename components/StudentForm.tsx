
import React, { useState } from 'react';
import { X, User, Mail, Phone, ChevronRight } from 'lucide-react';
import { Student } from '../types';

interface StudentFormProps {
  onClose: () => void;
  onSave: (student: Student) => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please provide at least a Full Name.");
      return;
    }

    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      name: name.trim(),
      email: email.trim() || 'N/A', // Default to N/A if empty
      phone: phone.trim() || 'N/A'  // Default to N/A if empty
    };

    onSave(newStudent);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-50 border-b border-slate-100 p-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Register Student</h2>
            <p className="text-slate-500 text-sm">Create a new membership profile</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input 
                type="text" 
                placeholder="e.g. John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-black font-semibold"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email Address <span className="text-[9px] font-medium lowercase">(Optional)</span>
              </label>
              <input 
                type="email" 
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-black font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Phone Number <span className="text-[9px] font-medium lowercase">(Optional)</span>
              </label>
              <input 
                type="tel" 
                placeholder="+91 00000 00000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-black font-medium"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-[0.98] group"
            >
              Confirm Registration 
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 font-medium italic">
              * Only Full Name is required to start booking seats.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
