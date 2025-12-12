import React from 'react';
import { cn } from '../utils/cn';
import type { SpacingToken } from '../tokens';

export interface BoxProps {
  children?: React.ReactNode;
  padding?: SpacingToken;
  paddingX?: SpacingToken;
  paddingY?: SpacingToken;
  paddingTop?: SpacingToken;
  paddingBottom?: SpacingToken;
  paddingLeft?: SpacingToken;
  paddingRight?: SpacingToken;
  margin?: SpacingToken;
  marginX?: SpacingToken;
  marginY?: SpacingToken;
  background?: 'surface' | 'card' | 'muted' | 'primary' | 'transparent';
  border?: boolean;
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  width?: 'auto' | 'full';
  height?: 'auto' | 'full' | 'screen';
}

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

const paddingXClasses: Record<SpacingToken, string> = {
  none: 'px-0',
  xs: 'px-1',
  sm: 'px-2',
  md: 'px-4',
  lg: 'px-6',
  xl: 'px-8',
  '2xl': 'px-12',
  '3xl': 'px-16',
};

const paddingYClasses: Record<SpacingToken, string> = {
  none: 'py-0',
  xs: 'py-1',
  sm: 'py-2',
  md: 'py-4',
  lg: 'py-6',
  xl: 'py-8',
  '2xl': 'py-12',
  '3xl': 'py-16',
};

const paddingTopClasses: Record<SpacingToken, string> = {
  none: 'pt-0',
  xs: 'pt-1',
  sm: 'pt-2',
  md: 'pt-4',
  lg: 'pt-6',
  xl: 'pt-8',
  '2xl': 'pt-12',
  '3xl': 'pt-16',
};

const paddingBottomClasses: Record<SpacingToken, string> = {
  none: 'pb-0',
  xs: 'pb-1',
  sm: 'pb-2',
  md: 'pb-4',
  lg: 'pb-6',
  xl: 'pb-8',
  '2xl': 'pb-12',
  '3xl': 'pb-16',
};

const paddingLeftClasses: Record<SpacingToken, string> = {
  none: 'pl-0',
  xs: 'pl-1',
  sm: 'pl-2',
  md: 'pl-4',
  lg: 'pl-6',
  xl: 'pl-8',
  '2xl': 'pl-12',
  '3xl': 'pl-16',
};

const paddingRightClasses: Record<SpacingToken, string> = {
  none: 'pr-0',
  xs: 'pr-1',
  sm: 'pr-2',
  md: 'pr-4',
  lg: 'pr-6',
  xl: 'pr-8',
  '2xl': 'pr-12',
  '3xl': 'pr-16',
};

const marginClasses: Record<SpacingToken, string> = {
  none: 'm-0',
  xs: 'm-1',
  sm: 'm-2',
  md: 'm-4',
  lg: 'm-6',
  xl: 'm-8',
  '2xl': 'm-12',
  '3xl': 'm-16',
};

const marginXClasses: Record<SpacingToken, string> = {
  none: 'mx-0',
  xs: 'mx-1',
  sm: 'mx-2',
  md: 'mx-4',
  lg: 'mx-6',
  xl: 'mx-8',
  '2xl': 'mx-12',
  '3xl': 'mx-16',
};

const marginYClasses: Record<SpacingToken, string> = {
  none: 'my-0',
  xs: 'my-1',
  sm: 'my-2',
  md: 'my-4',
  lg: 'my-6',
  xl: 'my-8',
  '2xl': 'my-12',
  '3xl': 'my-16',
};

const backgroundClasses = {
  surface: 'bg-white dark:bg-neutral-950',
  card: 'bg-neutral-50 dark:bg-neutral-900',
  muted: 'bg-neutral-100 dark:bg-neutral-800',
  primary: 'bg-primary-500',
  transparent: 'bg-transparent',
};

const radiusClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

const shadowClasses = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

export function Box({
  children,
  padding,
  paddingX,
  paddingY,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  margin,
  marginX,
  marginY,
  background = 'transparent',
  border = false,
  radius = 'none',
  shadow = 'none',
  width = 'auto',
  height = 'auto',
}: BoxProps) {
  return (
    <div
      className={cn(
        padding && paddingClasses[padding],
        paddingX && paddingXClasses[paddingX],
        paddingY && paddingYClasses[paddingY],
        paddingTop && paddingTopClasses[paddingTop],
        paddingBottom && paddingBottomClasses[paddingBottom],
        paddingLeft && paddingLeftClasses[paddingLeft],
        paddingRight && paddingRightClasses[paddingRight],
        margin && marginClasses[margin],
        marginX && marginXClasses[marginX],
        marginY && marginYClasses[marginY],
        backgroundClasses[background],
        border && 'border border-neutral-200 dark:border-neutral-800',
        radiusClasses[radius],
        shadowClasses[shadow],
        width === 'full' && 'w-full',
        height === 'full' && 'h-full',
        height === 'screen' && 'h-screen'
      )}
    >
      {children}
    </div>
  );
}
