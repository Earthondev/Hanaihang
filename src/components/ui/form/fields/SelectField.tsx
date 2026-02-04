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
  placeholder = 'เลือก...',
  helper,
  required = false,
  className = '',
  disabled = false,
}: SelectFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const _error = (errors as unknown)[name]?.message as string | undefined;
  const id = `f-${name}`;
  const helpId = helper ? `${id}-help` : undefined;
  const errorId = _error ? `${id}-error` : undefined;

  const describedBy = [];
  if (helper) describedBy.push(helpId);
  if (_error) describedBy.push(errorId);

  // Analytics tracking for field changes
  const handleFieldChange = (_e: React.ChangeEvent<HTMLSelectElement>) => {
    if (typeof window !== 'undefined' && (window as unknown).gtag) {
      (window as unknown).gtag('event', 'form_field_change', {
        event_category: 'form_actions',
        event_label: 'field_change',
        custom_parameter: {
          form: 'form',
          field_name: name,
          was_error: !!_error,
        },
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
        aria-describedby={
          describedBy.length > 0 ? describedBy.join(' ') : undefined
        }
        aria-invalid={_error ? 'true' : undefined}
        required={required}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          _error
            ? 'border-red-300 bg-red-50'
            : disabled
              ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        disabled={disabled}
        {...register(name, {
          onBlur: handleFieldChange,
        })}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper && (
        <p id={helpId} className="text-sm text-gray-500">
          {helper}
        </p>
      )}
      {_error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {_error}
        </p>
      )}
    </div>
  );
}
