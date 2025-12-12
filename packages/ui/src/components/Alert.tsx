import React from 'react';
import { cn } from '../utils/cn';

export interface AlertProps {
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const variantClasses = {
  default:
    'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-50',
  success:
    'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900 text-green-900 dark:text-green-50',
  warning:
    'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900 text-yellow-900 dark:text-yellow-50',
  error:
    'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 text-red-900 dark:text-red-50',
  info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-50',
};

export function Alert({ children, title, variant = 'default' }: AlertProps) {
  return (
    <div role="alert" className={cn('rounded-lg border p-4', variantClasses[variant])}>
      {title && <h5 className="font-semibold mb-1">{title}</h5>}
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}
