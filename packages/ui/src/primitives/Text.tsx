import React from 'react';
import { cn } from '../utils/cn';
import type { TextSize, TextWeight } from '../tokens';

export interface TextProps {
  children?: React.ReactNode;
  size?: TextSize;
  weight?: TextWeight;
  color?: 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'error';
  align?: 'left' | 'center' | 'right';
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';
  truncate?: boolean;
}

const sizeClasses: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

const weightClasses: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const colorClasses = {
  default: 'text-neutral-900 dark:text-neutral-50',
  muted: 'text-neutral-500 dark:text-neutral-400',
  primary: 'text-primary-600 dark:text-primary-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Text({
  children,
  size = 'base',
  weight = 'normal',
  color = 'default',
  align = 'left',
  as: Component = 'p',
  truncate = false,
}: TextProps) {
  return (
    <Component
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        truncate && 'truncate'
      )}
    >
      {children}
    </Component>
  );
}
