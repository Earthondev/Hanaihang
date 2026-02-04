import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

import { cn } from '../../utils/cn';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextType {
  push: (message: string, type?: Toast['type'], duration?: number) => void;
  remove: (id: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  push: () => {},
  remove: () => {}
});

export const useToast = () => useContext(ToastContext);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (message: string, type: Toast['type'] = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  };

  const remove = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastStyles = (type: Toast['type']) => {
    const base = 'flex items-center justify-between p-4 rounded-xl shadow-lg text-white min-w-[300px] max-w-[400px]';
    
    switch (type) {
      case 'success':
        return cn(base, 'bg-green-600');
      case 'error':
        return cn(base, 'bg-red-600');
      case 'warning':
        return cn(base, 'bg-yellow-600');
      case 'info':
        return cn(base, 'bg-blue-600');
      default:
        return cn(base, 'bg-gray-600');
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <Info className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              getToastStyles(toast.type),
              'animate-in slide-in-from-right-full duration-300'
            )}
          >
            <div className="flex items-center space-x-3">
              {getIcon(toast.type)}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => remove(toast.id)}
              className="ml-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Utility functions for quick toast calls
export const toast = {
  success: (message: string, duration?: number) => 
    (window as any).toastContext?.push(message, 'success', duration),
  error: (message: string, duration?: number) => 
    (window as any).toastContext?.push(message, 'error', duration),
  info: (message: string, duration?: number) => 
    (window as any).toastContext?.push(message, 'info', duration),
  warning: (message: string, duration?: number) => 
    (window as any).toastContext?.push(message, 'warning', duration),
};
