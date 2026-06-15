import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Egg, Trash2, Shield, Settings, Info } from 'lucide-react';

interface CatChoiceModalProps {
  isOpen: boolean;
  itemName: string;
  onChoice: (category: string) => void;
  onClose: () => void;
}

export default function CatChoiceModal({
  isOpen,
  itemName,
  onChoice,
  onClose,
}: CatChoiceModalProps) {
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

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 no-print text-right"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2 justify-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              بەشی کەلوپەل دیاری بکە
            </h3>
            <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-lg my-3 inline-block">
              📦 {itemName}
            </p>
            <p className="text-xs text-slate-500 mb-4 font-medium">ئەم کەلوپەلە دەتەوێت بۆ کام سەرەتا و بەش دابنێیت؟</p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => onChoice('stationery')}
                className="w-full rounded-xl border-2 border-slate-100 p-3.5 text-right font-semibold text-slate-700 transition-all hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✏️</span>
                  <span>قڕتاسیە</span>
                </div>
                <BookOpen className="h-5 w-5 text-indigo-500" />
              </button>

              <button
                onClick={() => onChoice('food')}
                className="w-full rounded-xl border-2 border-slate-100 p-3.5 text-right font-semibold text-slate-700 transition-all hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🍽️</span>
                  <span>خواردن</span>
                </div>
                <Egg className="h-5 w-5 text-amber-500" />
              </button>

              <button
                onClick={() => onChoice('cleaning')}
                className="w-full rounded-xl border-2 border-slate-100 p-3.5 text-right font-semibold text-slate-700 transition-all hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-700 cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🧹</span>
                  <span>خاوێن کردنەوە</span>
                </div>
                <Settings className="h-5 w-5 text-cyan-500" />
              </button>

              <button
                onClick={() => onChoice('')}
                className="w-full rounded-xl border-2 border-dashed border-slate-200 p-3 text-center font-medium text-slate-500 transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 cursor-pointer mt-2"
              >
                بێ بەش (گشتی / کارتەکان)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
