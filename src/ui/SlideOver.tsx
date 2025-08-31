import React from 'react';
import { X } from 'lucide-react';

import { cn } from '@/utils/cn';

interface SlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "right" | "left";
  children: React.ReactNode;
  className?: string;
}

export function SlideOver({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  children,
  className,
}: SlideOverProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Slide Over */}
      <div
        className={cn(
          "fixed top-0 z-50 h-full bg-white shadow-xl transition-transform duration-300 ease-in-out",
          side === "right" ? "right-0" : "left-0",
          side === "right" ? "translate-x-0" : "translate-x-0",
          className || "w-full sm:max-w-lg"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
