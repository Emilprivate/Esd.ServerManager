import React, { createContext, useContext, useState } from 'react';
import Toast from './toast';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'loading';
  message: string;
}

interface ToastContextType {
  addToast: (type: 'success' | 'error' | 'loading', message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'loading', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => {
      const updatedToasts = [...prev, { id, type, message }];
      if (updatedToasts.length > 3) {
        updatedToasts.shift();
      }
      return updatedToasts;
    });
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
