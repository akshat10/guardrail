import type { SpacingToken } from '../tokens';

export interface SpacerProps {
  size?: SpacingToken;
  axis?: 'horizontal' | 'vertical';
}

const sizeClassesVertical: Record<SpacingToken, string> = {
  none: 'h-0',
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
  xl: 'h-8',
  '2xl': 'h-12',
  '3xl': 'h-16',
};

const sizeClassesHorizontal: Record<SpacingToken, string> = {
  none: 'w-0',
  xs: 'w-1',
  sm: 'w-2',
  md: 'w-4',
  lg: 'w-6',
  xl: 'w-8',
  '2xl': 'w-12',
  '3xl': 'w-16',
};

export function Spacer({ size = 'md', axis = 'vertical' }: SpacerProps) {
  const sizeClasses = axis === 'vertical' ? sizeClassesVertical : sizeClassesHorizontal;
  return <div className={sizeClasses[size]} aria-hidden="true" />;
}
