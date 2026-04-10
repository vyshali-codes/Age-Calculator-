import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DateTime } from 'luxon';

interface DatePickerProps {
  value: DateTime | null;
  onChange: (date: DateTime | null) => void;
  onError?: (error: string | null) => void;
  maxDate?: DateTime;
}

export default function DatePicker({ value, onChange, onError, maxDate = DateTime.now() }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || DateTime.now());
  const [inputValue, setInputValue] = useState(value ? value.toFormat('dd/MM/yyyy') : '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setInputValue(value.toFormat('dd/MM/yyyy'));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (!val) {
      onChange(null);
      onError?.(null);
      return;
    }

    // Basic format check (DD/MM/YYYY)
    const formatRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!formatRegex.test(val)) {
      if (val.length >= 10) {
        onError?.('Please use the format DD/MM/YYYY');
      } else {
        onError?.(null); // Don't show error while still typing
      }
      onChange(null);
      return;
    }

    // Try to parse DD/MM/YYYY
    const parsed = DateTime.fromFormat(val, 'dd/MM/yyyy');
    
    if (!parsed.isValid) {
      onError?.('Invalid date. Please check the day and month.');
      onChange(null);
      return;
    }

    if (parsed > maxDate) {
      onError?.('Birth date cannot be in the future.');
      onChange(null);
      return;
    }

    // If we reach here, it's valid
    onError?.(null);
    onChange(parsed);
    setViewDate(parsed);
  };

  const handleInputBlur = () => {
    if (value) {
      setInputValue(value.toFormat('dd/MM/yyyy'));
      onError?.(null);
    } else if (inputValue === '') {
      onError?.(null);
    } else {
      // If there's invalid text on blur, we might want to keep the error or clear it
      // For now, let's just keep the input as is if it's invalid
    }
  };

  const daysInMonth = viewDate.daysInMonth || 31;
  const startOfMonth = viewDate.startOf('month');
  const startDayOfWeek = startOfMonth.weekday % 7; // 0 is Sunday for our grid

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prevMonthDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => setViewDate(viewDate.minus({ months: 1 }));
  const handleNextMonth = () => {
    const next = viewDate.plus({ months: 1 });
    if (next.startOf('month') <= maxDate.startOf('month')) {
      setViewDate(next);
    }
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = viewDate.set({ day });
    if (selectedDate <= maxDate) {
      onChange(selectedDate);
      setIsOpen(false);
    }
  };

  const isSelected = (day: number) => 
    value && value.hasSame(viewDate.set({ day }), 'day');

  const isToday = (day: number) => 
    DateTime.now().hasSame(viewDate.set({ day }), 'day');

  const isFuture = (day: number) => 
    viewDate.set({ day }) > maxDate;

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-lavender-400 transition-all focus-within:ring-2 focus-within:ring-lavender-500 group"
      >
        <div className="flex items-center gap-3 flex-1">
          <CalendarIcon className="w-5 h-5 text-lavender-500" />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => setIsOpen(true)}
            placeholder="DD/MM/YYYY"
            className="bg-transparent border-none outline-none w-full text-slate-900 placeholder:text-slate-400 font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          {value && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(null as any);
                setInputValue('');
              }}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
            </button>
          )}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 mt-2 w-full sm:w-[320px] bg-white border border-slate-100 rounded-2xl shadow-2xl p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">
                  {months[viewDate.month - 1]}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {viewDate.year}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button 
                  onClick={handleNextMonth} 
                  disabled={viewDate.startOf('month') >= maxDate.startOf('month')}
                  className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={`${day}-${index}`} className="text-center text-[10px] font-black text-slate-400 uppercase py-1 tracking-widest">
                  {day}
                </div>
              ))}
              {prevMonthDays.map((_, i) => (
                <div key={`prev-${i}`} className="h-9" />
              ))}
              {days.map((day) => {
                const future = isFuture(day);
                const selected = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    disabled={future}
                    onClick={() => handleDateSelect(day)}
                    className={`
                      h-9 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${future ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-lavender-50 text-slate-700'}
                      ${selected ? 'bg-lavender-600 text-white hover:bg-lavender-700 shadow-md' : ''}
                      ${today && !selected ? 'text-lavender-600 font-black border border-lavender-100' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <select 
                value={viewDate.year}
                onChange={(e) => setViewDate(viewDate.set({ year: parseInt(e.target.value) }))}
                className="text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-slate-500 hover:text-slate-700"
              >
                {Array.from({ length: 121 }, (_, i) => maxDate.year - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <button 
                onClick={() => {
                  setViewDate(DateTime.now());
                  onChange(DateTime.now());
                  setIsOpen(false);
                }}
                className="text-xs font-black text-lavender-600 hover:text-lavender-700 uppercase tracking-wider"
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
