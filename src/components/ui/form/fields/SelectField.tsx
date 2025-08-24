import React from 'react';
import { useFormContext } from 'react-hook-form';

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  name: string;
  label: string;
  options: Option[];
  placeholder?: string;
  helper?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function SelectField({
  name,
  label,
  options,
  placeholder = "เลือก...",
  helper,
  required = false,
  className = "",
  disabled = false
}: SelectFieldProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;
  const id = `f-${name}`;
  const descId = helper || error ? `${id}-desc` : undefined;

  // Analytics tracking for field changes
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
      <select
        id={id}
        aria-describedby={descId}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error 
            ? "border-red-300 bg-red-50" 
            : disabled
            ? "border-gray-200 bg-gray-100 cursor-not-allowed"
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
        disabled={disabled}
        {...register(name, {
          onBlur: handleFieldChange
        })}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
