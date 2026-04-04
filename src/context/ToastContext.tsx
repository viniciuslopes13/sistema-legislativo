import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 min-w-[320px] max-w-[420px]">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                "p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md",
                toast.type === 'success' && "bg-white/90 border-green-100 text-green-800",
                toast.type === 'error' && "bg-white/90 border-red-100 text-red-800",
                toast.type === 'info' && "bg-white/90 border-blue-100 text-blue-800"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg shrink-0",
                toast.type === 'success' && "bg-green-50 text-green-600",
                toast.type === 'error' && "bg-red-50 text-red-600",
                toast.type === 'info' && "bg-blue-50 text-blue-600"
              )}>
                {toast.type === 'success' && <CheckCircle2 size={20} />}
                {toast.type === 'error' && <XCircle size={20} />}
                {toast.type === 'info' && <AlertCircle size={20} />}
              </div>
              <p className="text-sm font-bold flex-1 pt-0.5 leading-relaxed">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de um ToastProvider');
  return context;
};
