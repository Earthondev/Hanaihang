import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Clock } from 'lucide-react';

interface TimeFieldProps {
  name: string;
  label: string;
  required?: boolean;
  helper?: string;
  className?: string;
}

export default function TimeField({ 
  name, 
  label, 
  required = false, 
  helper,
  className = "" 
}: TimeFieldProps) {
  const { register, formState: { errors } } = useFormContext();
  const _error = errors[name]?.message as string;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          {...register(name)}
          type="time"
          className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
          aria-describedby={helper ? `${name}-helper` : undefined}
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>
      
      {helper && (
        <p className="mt-1 text-sm text-gray-500" id={`${name}-helper`}>
          {helper}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
