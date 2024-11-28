import React from 'react';
import { FaSpinner } from 'react-icons/fa';

interface CircularLoaderProps {
  message: string;
}

const CircularLoader: React.FC<CircularLoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-2">
      <FaSpinner className="animate-spin text-blue-500 text-4xl" />
      <span className="text-gray-300">{message}</span>
    </div>
  );
};

export default CircularLoader;
