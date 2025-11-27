import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'danger',
}) => {
  if (!isOpen) return null;

  const bgColor = type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50';
  const borderColor = type === 'danger' ? 'border-red-200' : type === 'warning' ? 'border-yellow-200' : 'border-blue-200';
  const iconColor = type === 'danger' ? 'text-red-600' : type === 'warning' ? 'text-yellow-600' : 'text-blue-600';
  const titleColor = type === 'danger' ? 'text-red-800' : type === 'warning' ? 'text-yellow-800' : 'text-blue-800';
  const messageColor = type === 'danger' ? 'text-red-700' : type === 'warning' ? 'text-yellow-700' : 'text-blue-700';
  const confirmButtonColor = type === 'danger' 
    ? 'bg-red-600 hover:bg-red-700' 
    : type === 'warning' 
    ? 'bg-yellow-600 hover:bg-yellow-700' 
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className={`relative mx-auto p-6 border rounded-lg shadow-lg ${bgColor} ${borderColor} max-w-md w-11/12`}>
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className={`flex-shrink-0 ${iconColor} mb-4`}>
            <AlertTriangle className="h-8 w-8" />
          </div>
          
          <div className="w-full">
            <h3 className={`text-lg font-semibold ${titleColor} mb-2`}>
              {title}
            </h3>
            <p className={`text-sm ${messageColor}`}>
              {message}
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${confirmButtonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

