import React from 'react';
import { cn } from '../utils/cn';

export interface SwitchProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
}

export function Switch({
  label,
  checked = false,
  onChange,
  disabled = false,
  description,
}: SwitchProps) {
  const id = React.useId();

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
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
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
            'transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
