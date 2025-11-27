import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error';

interface NotificationModalProps {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-green-200' : 'border-red-200';
  const iconColor = isSuccess ? 'text-green-600' : 'text-red-600';
  const titleColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const messageColor = isSuccess ? 'text-green-700' : 'text-red-700';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className={`relative mx-auto p-6 border rounded-lg shadow-lg ${bgColor} ${borderColor} max-w-md w-11/12`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className={`flex-shrink-0 ${iconColor} mb-4`}>
            {isSuccess ? (
              <CheckCircle className="h-8 w-8" />
            ) : (
              <XCircle className="h-8 w-8" />
            )}
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
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isSuccess
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

