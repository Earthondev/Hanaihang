import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
}

export function SuccessModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  onConfirm,
  confirmText = "ตกลง"
}: SuccessModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center mb-6">{message}</p>
          
          {/* Actions */}
          <div className="flex justify-center">
            <button
              onClick={handleConfirm}
              className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Animated Success Modal with celebration effect
export function AnimatedSuccessModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  onConfirm,
  confirmText = "ตกลง"
}: SuccessModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with animation */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal with animation */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-500 scale-100 animate-in zoom-in-95 slide-in-from-bottom-4">
        {/* Celebration Header */}
        <div className="relative p-6 text-center">
          {/* Confetti effect */}
          <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-0 left-3/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            <div className="absolute top-2 left-1/3 w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
            <div className="absolute top-2 left-2/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }} />
          </div>
          
          {/* Success Icon */}
          <div className="relative z-10 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50 duration-700">
            <CheckCircle className="w-10 h-10 text-green-600 animate-in scale-in-150 duration-500" style={{ animationDelay: '0.3s' }} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2 animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '0.5s' }}>
            {title}
          </h3>
          <p className="text-gray-600 animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '0.7s' }}>
            {message}
          </p>
        </div>
        
        {/* Actions */}
        <div className="p-6 pt-0">
          <div className="flex justify-center animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '0.9s' }}>
            <button
              onClick={handleConfirm}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
