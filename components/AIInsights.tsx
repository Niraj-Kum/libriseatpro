
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, BrainCircuit, RefreshCw } from 'lucide-react';
import { getAIInsights } from '../services/geminiService';
import { Booking } from '../types';

interface AIInsightsProps {
  bookings: Booking[];
  totalRevenue: number;
  totalDues: number;
}

const AIInsights: React.FC<AIInsightsProps> = ({ bookings, totalRevenue, totalDues }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    const text = await getAIInsights(bookings, totalRevenue, totalDues);
    setInsight(text || "AI is resting. Try again in a moment.");
    setLoading(false);
  };

  useEffect(() => {
    if (bookings.length > 0) fetchInsights();
  }, []);

  return (
    <div className="relative group overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200">
      {/* Abstract background blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Smart AI Insights</h2>
              <p className="text-indigo-200 text-xs">Powered by Gemini AI</p>
            </div>
          </div>
          <button 
            onClick={fetchInsights}
            disabled={loading}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-white/60" />
            <p className="text-white/60 text-sm animate-pulse">Analyzing library patterns & financial data...</p>
          </div>
        ) : insight ? (
          <div className="prose prose-invert prose-sm max-w-none">
             {insight.split('\n').map((line, i) => (
               <p key={i} className="mb-2 text-indigo-50 leading-relaxed text-sm">{line}</p>
             ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Sparkles className="w-10 h-10 text-white/40" />
            <p className="text-white/60 text-sm">Create some bookings to see AI business analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
