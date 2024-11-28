import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

interface ToastProps {
  type: 'success' | 'error' | 'loading';
  message: string;
}

const Toast: React.FC<ToastProps> = ({ type, message }) => {
  const getIcon = () => {
    if (type === 'success') return <FaCheckCircle className="text-green-500" />;
    if (type === 'error') return <FaExclamationCircle className="text-red-500" />;
    if (type === 'loading') return <FaSpinner className="animate-spin text-blue-500" />;
  };

  return (
    <div className="flex items-center space-x-3 bg-gray-800 text-gray-200 p-4 rounded shadow-md max-w-sm">
      {getIcon()}
      <span>{message}</span>
    </div>
  );
};

export default Toast;
