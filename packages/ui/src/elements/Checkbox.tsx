import React from 'react';
import { cn } from '../utils/cn';

export interface CheckboxProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
}

export function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  description,
}: CheckboxProps) {
  const id = React.useId();

  return (
    <div className="flex items-start">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className={cn(
          'h-4 w-4 rounded border-neutral-300 dark:border-neutral-700',
          'text-primary-600 focus:ring-primary-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'mt-1'
        )}
      />
      <div className="ml-3">
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium',
            disabled ? 'text-neutral-400' : 'text-neutral-900 dark:text-neutral-50'
          )}
        >
          {label}
        </label>
        {description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
        )}
      </div>
    </div>
  );
}
