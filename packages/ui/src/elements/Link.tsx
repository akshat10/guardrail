import React from 'react';
import { cn } from '../utils/cn';

export interface LinkProps {
  children: React.ReactNode;
  href: string;
  external?: boolean;
  variant?: 'default' | 'muted';
}

export function Link({ children, href, external = false, variant = 'default' }: LinkProps) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'underline underline-offset-4 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded',
        variant === 'default'
          ? 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
          : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
      )}
    >
      {children}
    </a>
  );
}
