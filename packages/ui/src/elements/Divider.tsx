
import { cn } from '../utils/cn';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
}

const horizontalSpacing = {
  sm: 'my-2',
  md: 'my-4',
  lg: 'my-6',
};

const verticalSpacing = {
  sm: 'mx-2',
  md: 'mx-4',
  lg: 'mx-6',
};

export function Divider({ orientation = 'horizontal', spacing = 'md' }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn(
          'w-px bg-neutral-200 dark:bg-neutral-700 self-stretch',
          verticalSpacing[spacing]
        )}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  return (
    <div
      className={cn(
        'h-px w-full bg-neutral-200 dark:bg-neutral-700',
        horizontalSpacing[spacing]
      )}
      role="separator"
      aria-orientation="horizontal"
    />
  );
}
