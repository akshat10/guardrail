import React from 'react';
import { cn } from '../utils/cn';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ src, alt, fallback, size = 'md' }: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);

  const initials = fallback
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt || fallback}
        onError={() => setHasError(true)}
        className={cn('rounded-full object-cover', sizeClasses[size])}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400',
        'flex items-center justify-center font-medium',
        sizeClasses[size]
      )}
      aria-label={alt || fallback}
    >
      {initials}
    </div>
  );
}
