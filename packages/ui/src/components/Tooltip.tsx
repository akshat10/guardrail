import React from 'react';
import { cn } from '../utils/cn';

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

export interface TooltipProps {
  children: React.ReactNode;
}

export function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps {
  children: React.ReactNode;
}

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error('TooltipTrigger must be used within Tooltip');

  return (
    <div
      onMouseEnter={() => context.setOpen(true)}
      onMouseLeave={() => context.setOpen(false)}
      onFocus={() => context.setOpen(true)}
      onBlur={() => context.setOpen(false)}
    >
      {children}
    </div>
  );
}

export interface TooltipContentProps {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function TooltipContent({ children, side = 'top' }: TooltipContentProps) {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error('TooltipContent must be used within Tooltip');

  if (!context.open) return null;

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={cn(
        'absolute z-50 px-3 py-1.5 text-sm rounded-md shadow-md',
        'bg-neutral-900 dark:bg-neutral-50 text-neutral-50 dark:text-neutral-900',
        'whitespace-nowrap',
        sideClasses[side]
      )}
      role="tooltip"
    >
      {children}
    </div>
  );
}
