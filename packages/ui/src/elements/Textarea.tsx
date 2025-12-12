import React from 'react';
import { cn } from '../utils/cn';

export interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function Textarea({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  disabled = false,
  error,
  helperText,
  required = false,
}: TextareaProps) {
  const id = React.useId();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        rows={rows}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full px-3 py-2 rounded-md border transition-colors resize-none',
          'text-neutral-900 dark:text-neutral-50',
          'bg-white dark:bg-neutral-950',
          'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-neutral-300 dark:border-neutral-700 focus:ring-primary-500 focus:border-primary-500'
        )}
      />
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{helperText}</p>
      )}
    </div>
  );
}
