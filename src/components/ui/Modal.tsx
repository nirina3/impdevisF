import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm sm:max-w-md',
    md: 'max-w-md sm:max-w-lg',
    lg: 'max-w-lg sm:max-w-xl lg:max-w-2xl',
    xl: 'max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ zIndex: 9999 }}>
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 lg:px-6 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className={`modal-content inline-block w-full ${sizeClasses[size]} p-4 sm:p-6 lg:p-8 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg sm:rounded-xl`}>
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900 pr-4 leading-tight">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 sm:p-1 hover:bg-gray-100 rounded-lg flex-shrink-0 touch-target"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)] lg:max-h-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;