import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = 'danger',
  loading = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
          >
            <div className="p-8 text-center">
              <div className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg",
                variant === 'danger' && "bg-red-50 text-red-600 shadow-red-100",
                variant === 'warning' && "bg-amber-50 text-amber-600 shadow-amber-100",
                variant === 'info' && "bg-blue-50 text-blue-600 shadow-blue-100"
              )}>
                <AlertCircle size={40} strokeWidth={2.5} />
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-500 font-medium leading-relaxed">{message}</p>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={cn(
                  "flex-1 py-4 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2",
                  variant === 'danger' && "bg-red-600 hover:bg-red-700 shadow-red-200",
                  variant === 'warning' && "bg-amber-600 hover:bg-amber-700 shadow-amber-200",
                  variant === 'info' && "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                )}
              >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
