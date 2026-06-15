import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, X, Calendar, Check } from 'lucide-react';

interface YearModalProps {
  isOpen: boolean;
  years: string[];
  activeYear: string;
  onSelectYear: (year: string) => void;
  onAddYear: (year: string) => void;
  onClose: () => void;
}

export default function YearModal({
  isOpen,
  years,
  activeYear,
  onSelectYear,
  onAddYear,
  onClose,
}: YearModalProps) {
  const [newYear, setNewYear] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newYear.trim();
    if (!val || isNaN(Number(val)) || val.length !== 4) {
      alert('تکایە ساڵێکی دروست بنووسە (بۆ نموونە: 2026)');
      return;
    }
    onAddYear(val);
    setNewYear('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-100 no-print text-right"
          >
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                هەڵبژاردنی ساڵی چالاک
              </h3>
            </div>

            {/* List of Years */}
            <div className="max-h-56 overflow-y-auto mb-4 border border-slate-100 rounded-xl divide-y divide-slate-100">
              {years.map((y) => {
                const isActive = y === activeYear;
                return (
                  <button
                    key={y}
                    onClick={() => {
                      onSelectYear(y);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3.5 transition-all text-right font-semibold cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      <span>سالی {y}</span>
                    </span>
                    {isActive && <Check className="h-4 w-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>

            {/* Add New Year */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="ساڵی نوێ..."
                className="w-24 rounded-xl border-1.5 border-slate-200 bg-white py-2 px-3 text-sm font-semibold text-slate-800 outline-hidden transition-all focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 font-mono text-center"
              />
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 text-sm font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                زیاد بکە
              </button>
            </form>

            <button
              onClick={onClose}
              className="w-full mt-4 rounded-xl border border-slate-200 bg-white py-2 px-4 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-50 active:scale-95 cursor-pointer text-center"
            >
              داخستن
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
