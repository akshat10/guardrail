import React from 'react';
import { cn } from '../utils/cn';
import type { SpacingToken } from '../tokens';

export interface FlexProps {
  children?: React.ReactNode;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: SpacingToken;
  wrap?: boolean;
  padding?: SpacingToken;
  width?: 'auto' | 'full';
  height?: 'auto' | 'full';
}

const directionClasses = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
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

export function Flex({
  children,
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  gap = 'none',
  wrap = false,
  padding,
  width = 'auto',
  height = 'auto',
}: FlexProps) {
  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        wrap && 'flex-wrap',
        padding && paddingClasses[padding],
        width === 'full' && 'w-full',
        height === 'full' && 'h-full'
      )}
    >
      {children}
    </div>
  );
}
