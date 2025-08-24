import React from 'react';
import { cn } from '../../utils/cn';

interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function BaseButton({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  className = '', 
  disabled,
  children,
  ...props 
}: BaseButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]';
  
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-12 px-5 text-base'
  };
  
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 focus-visible:outline-green-700 shadow-sm hover:shadow-md',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-700 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-400',
    outline: 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:outline-gray-400'
  };

  return (
    <button 
      className={cn(
        base, 
        sizes[size], 
        variants[variant], 
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
