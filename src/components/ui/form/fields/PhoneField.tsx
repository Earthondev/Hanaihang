import React from 'react';
import { useFormContext } from 'react-hook-form';

interface PhoneFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  helper?: string;
  required?: boolean;
  className?: string;
}

export default function PhoneField({
  name,
  label,
  placeholder = "+66 81 234 5678",
  helper,
  required = false,
  className = ""
}: PhoneFieldProps) {
  const { register, formState: { errors } } = useFormContext();
  const _error = (errors as any)[name]?.message as string | undefined;
  const id = `f-${name}`;
  const helpId = helper ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  
  const describedBy = [];
  if (helper) describedBy.push(helpId);
  if (error) describedBy.push(errorId);

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Add +66 prefix if it's a Thai number
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return `+66${cleaned.slice(1)}`;
    }
    
    // Add + if it starts with 66
    if (cleaned.length === 11 && cleaned.startsWith('66')) {
      return `+${cleaned}`;
    }
    
    return cleaned;
  };

  // Analytics tracking for field changes
  const handleFieldChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'form_field_change', {
        event_category: 'form_actions',
        event_label: 'field_change',
        custom_parameter: {
          form: 'form',
          field_name: name,
          was_error: !!error
        }
      });
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        type="tel"
        aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        autoComplete="tel"
        placeholder={placeholder}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error 
            ? "border-red-300 bg-red-50" 
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
        {...register(name, {
          onBlur: (e) => {
            // Format the phone number
            const formatted = formatPhoneNumber(e.target.value);
            e.target.value = formatted;
            handleFieldChange(e);
          }
        })}
      />
      {helper && (
        <p 
          id={helpId} 
          className="text-sm text-gray-500"
        >
          {helper}
        </p>
      )}
      {error && (
        <p 
          id={errorId} 
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
