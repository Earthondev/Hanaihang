import React from 'react';
import { useFormContext } from 'react-hook-form';

interface UrlFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  helper?: string;
  required?: boolean;
  className?: string;
}

export default function UrlField({
  name,
  label,
  placeholder = 'https://example.com',
  helper,
  required = false,
  className = '',
}: UrlFieldProps) {
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

  // Format URL
  const formatUrl = (value: string) => {
    if (!value) return value;

    // Add https:// if no protocol
    if (!value.match(/^https?:\/\//)) {
      return `https://${value}`;
    }

    return value;
  };

  // Analytics tracking for field changes
  const handleFieldChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
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
      <input
        id={id}
        type="url"
        aria-describedby={
          describedBy.length > 0 ? describedBy.join(' ') : undefined
        }
        aria-invalid={_error ? 'true' : undefined}
        required={required}
        autoComplete="url"
        placeholder={placeholder}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          _error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        {...register(name, {
          onBlur: e => {
            // Format the URL
            const formatted = formatUrl(e.target.value);
            e.target.value = formatted;
            handleFieldChange(e);
          },
        })}
      />
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
