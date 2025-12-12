import React from 'react';
import { cn } from '../utils/cn';
import type { SpacingToken } from '../tokens';

export interface GridProps {
  children?: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: SpacingToken;
  rowGap?: SpacingToken;
  columnGap?: SpacingToken;
  padding?: SpacingToken;
  width?: 'auto' | 'full';
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

const gapClasses: Record<SpacingToken, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
  '3xl': 'gap-16',
};

const rowGapClasses: Record<SpacingToken, string> = {
  none: 'gap-y-0',
  xs: 'gap-y-1',
  sm: 'gap-y-2',
  md: 'gap-y-4',
  lg: 'gap-y-6',
  xl: 'gap-y-8',
  '2xl': 'gap-y-12',
  '3xl': 'gap-y-16',
};

const columnGapClasses: Record<SpacingToken, string> = {
  none: 'gap-x-0',
  xs: 'gap-x-1',
  sm: 'gap-x-2',
  md: 'gap-x-4',
  lg: 'gap-x-6',
  xl: 'gap-x-8',
  '2xl': 'gap-x-12',
  '3xl': 'gap-x-16',
};

const paddingClasses: Record<SpacingToken, string> = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-12',
  '3xl': 'p-16',
};

export function Grid({
  children,
  columns = 1,
  gap = 'md',
  rowGap,
  columnGap,
  padding,
  width = 'auto',
}: GridProps) {
  return (
    <div
      className={cn(
        'grid',
        columnClasses[columns],
        !rowGap && !columnGap && gapClasses[gap],
        rowGap && rowGapClasses[rowGap],
        columnGap && columnGapClasses[columnGap],
        padding && paddingClasses[padding],
        width === 'full' && 'w-full'
      )}
    >
      {children}
    </div>
  );
}
