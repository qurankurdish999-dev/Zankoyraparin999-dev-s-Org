import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-100 no-print text-right"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
              <p className="text-sm text-slate-500 mb-6">{message}</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-red-600 py-2.5 px-4 text-sm font-semibold text-white transition-all hover:bg-red-500 active:scale-95 cursor-pointer"
              >
                بەڵێ، بسڕەوە
              </button>
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 cursor-pointer"
              >
                نەخێر
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
