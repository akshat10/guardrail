import React from 'react';
import { cn } from '../utils/cn';

export interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, padding = 'none' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 dark:border-neutral-800',
        'bg-white dark:bg-neutral-950 shadow-sm',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-6',
        padding === 'lg' && 'p-8'
      )}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children: React.ReactNode;
}

export function CardHeader({ children }: CardHeaderProps) {
  return <div className="px-6 pt-6 pb-2">{children}</div>;
}

export interface CardTitleProps {
  children: React.ReactNode;
}

export function CardTitle({ children }: CardTitleProps) {
  return (
    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{children}</h3>
  );
}

export interface CardDescriptionProps {
  children: React.ReactNode;
}

export function CardDescription({ children }: CardDescriptionProps) {
  return <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{children}</p>;
}

export interface CardContentProps {
  children: React.ReactNode;
}

export function CardContent({ children }: CardContentProps) {
  return <div className="px-6 py-4">{children}</div>;
}

export interface CardFooterProps {
  children: React.ReactNode;
}

export function CardFooter({ children }: CardFooterProps) {
  return <div className="px-6 pb-6 pt-2 flex items-center gap-4">{children}</div>;
}
