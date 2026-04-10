import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Calculator, Clock, Calendar, ChevronRight, Info } from 'lucide-react';
import { DateTime, Interval } from 'luxon';
import DatePicker from './components/DatePicker';

interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  nextBirthday: {
    months: number;
    days: number;
    totalDays: number;
  };
}

function CountUp({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Ease out quad
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeProgress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <motion.span
      initial={{ opacity: 0, filter: 'blur(4px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.8 }}
    >
      {count}
    </motion.span>
  );
}

export default function App() {
  const [birthDate, setBirthDate] = useState<DateTime | null>(null);
  const [result, setResult] = useState<AgeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateAge = () => {
    if (!birthDate) {
      setError('Please select your birth date first.');
      setResult(null);
      return;
    }

    const now = DateTime.now();
    
    if (birthDate > now) {
      setError('Birth date cannot be in the future.');
      setResult(null);
      return;
    }

    setError(null);

    // Exact Age
    const diff = now.diff(birthDate, ['years', 'months', 'days']).toObject();
    
    // Total stats
    const totalDays = Math.floor(now.diff(birthDate, 'days').days);
    const totalHours = Math.floor(now.diff(birthDate, 'hours').hours);
    const totalMinutes = Math.floor(now.diff(birthDate, 'minutes').minutes);

    // Next Birthday
    let nextBday = birthDate.set({ year: now.year });
    if (nextBday < now.startOf('day')) {
      nextBday = nextBday.set({ year: now.year + 1 });
    }
    
    const nextBdayDiff = nextBday.diff(now.startOf('day'), ['months', 'days']).toObject();
    const nextBdayTotalDays = Math.ceil(nextBday.diff(now.startOf('day'), 'days').days);

    setResult({
      years: Math.floor(diff.years || 0),
      months: Math.floor(diff.months || 0),
      days: Math.floor(diff.days || 0),
      totalDays,
      totalHours,
      totalMinutes,
      nextBirthday: {
        months: Math.floor(nextBdayDiff.months || 0),
        days: Math.floor(nextBdayDiff.days || 0),
        totalDays: nextBdayTotalDays
      }
    });
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center justify-center font-sans bg-slate-50">
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-center items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-lavender-600 rounded-xl text-white shadow-lg shadow-lavender-200">
            <Calculator className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Age<span className="text-lavender-600">Calc</span>
          </h1>
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-12"
      >
        <div className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-[0.2em]">
              Enter your birth date
            </label>
            <DatePicker 
              value={birthDate} 
              onChange={(date) => {
                setBirthDate(date);
                if (!date) {
                  setResult(null);
                }
              }} 
              onError={(msg) => setError(msg)}
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-3 text-sm font-medium text-red-600 flex items-center gap-1.5"
              >
                <Info className="w-4 h-4" /> {error}
              </motion.p>
            )}
          </div>

          <button
            onClick={calculateAge}
            className="w-full py-5 bg-lavender-600 hover:bg-lavender-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-lavender-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            Calculate Age
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mt-16 space-y-12 overflow-hidden"
            >
              {/* Primary Age Display */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <ResultCard label="Years" value={result.years} />
                <ResultCard label="Months" value={result.months} />
                <ResultCard label="Days" value={result.days} />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-5"
                >
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Next Birthday
                  </h3>
                  <div className="bg-lavender-50 rounded-3xl p-6 border border-lavender-100">
                    <p className="text-slate-600 text-sm font-medium">
                      Your next birthday is in
                    </p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-lavender-600 tracking-tight">
                        <CountUp value={result.nextBirthday.totalDays} />
                      </span>
                      <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">days</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-3">
                      ({result.nextBirthday.months} months and {result.nextBirthday.days} days)
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-5"
                >
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Total Breakdown
                  </h3>
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                    <StatRow label="Total Days" value={result.totalDays.toLocaleString()} />
                    <StatRow label="Total Hours" value={result.totalHours.toLocaleString()} />
                    <StatRow label="Total Minutes" value={result.totalMinutes.toLocaleString()} />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <footer className="mt-16 text-slate-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
        Built with <span className="text-red-400">♥</span> using Luxon & Motion
      </footer>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: number }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
    >
      <span className="text-4xl sm:text-6xl font-black text-lavender-600 tabular-nums tracking-tighter">
        <CountUp value={value} />
      </span>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
        {label}
      </span>
    </motion.div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}
