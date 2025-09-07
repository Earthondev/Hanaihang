import React from 'react';
import { useFormContext } from 'react-hook-form';

interface TextFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  helper?: string;
  required?: boolean;
  autoComplete?: string;
  type?: string;
  className?: string;
}

export default function TextField({
  name,
  label,
  placeholder,
  helper,
  required = false,
  autoComplete = "off",
  type = "text",
  className = ""
}: TextFieldProps) {
  const { register, formState: { errors } } = useFormContext();
  const _error = (errors as any)[name]?.message as string | undefined;
  const id = `f-${name}`;
  const helpId = helper ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  
  const describedBy = [];
  if (helper) describedBy.push(helpId);
  if (error) describedBy.push(errorId);

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
        type={type}
        aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error 
            ? "border-red-300 bg-red-50" 
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
        {...register(name, {
          onBlur: handleFieldChange
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
