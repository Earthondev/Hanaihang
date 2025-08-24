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
  const error = (errors as any)[name]?.message as string | undefined;
  const id = `f-${name}`;
  const descId = helper || error ? `${id}-desc` : undefined;

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
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        aria-describedby={descId}
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
      {(helper || error) && (
        <p 
          id={descId} 
          className={`text-sm ${
            error ? "text-red-600" : "text-gray-500"
          }`}
        >
          {error || helper}
        </p>
      )}
    </div>
  );
}
