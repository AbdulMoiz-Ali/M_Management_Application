import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

// Main Confirmation Dialog Component
const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    const baseStyles = {
      danger: {
        icon: AlertTriangle,
        iconColor: 'text-red-500 dark:text-red-400',
        confirmBg: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
        titleColor: 'text-red-600 dark:text-red-400'
      },
      warning: {
        icon: AlertTriangle,
        iconColor: 'text-yellow-500 dark:text-yellow-400',
        confirmBg: 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700',
        titleColor: 'text-yellow-600 dark:text-yellow-400'
      },
      info: {
        icon: Check,
        iconColor: 'text-blue-500 dark:text-blue-400',
        confirmBg: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
        titleColor: 'text-blue-600 dark:text-blue-400'
      }
    };
    return baseStyles[type];
  };

  const typeStyles = getTypeStyles();
  const IconComponent = typeStyles.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg shadow-xl transition-all bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-opacity-10">
              <IconComponent className={`h-8 w-8 ${typeStyles.iconColor}`} />
            </div>

            {/* Title */}
            <div className="mt-4 text-center">
              <h3 className={`text-lg font-semibold ${typeStyles.titleColor}`}>
                {title}
              </h3>
            </div>

            {/* Message */}
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {message}
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-gray-500"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${typeStyles.confirmBg}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Hook for easier usage
const useConfirmDialog = () => {
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });

  const showConfirm = ({
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Delete",
    cancelText = "Cancel",
    type = "danger"
  }) => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setDialog(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  };

  const hideConfirm = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const ConfirmDialog = () => (
    <ConfirmationDialog
      isOpen={dialog.isOpen}
      onClose={hideConfirm}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      message={dialog.message}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      type={dialog.type}
    />
  );

  return { showConfirm, ConfirmDialog };
};

export default useConfirmDialog