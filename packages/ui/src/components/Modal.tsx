import React from 'react';
import { cn } from '../utils/cn';

interface ModalContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

export interface ModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Modal({ children, open: controlledOpen, onOpenChange }: ModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <ModalContext.Provider value={{ open, setOpen }}>{children}</ModalContext.Provider>
  );
}

export interface ModalTriggerProps {
  children: React.ReactNode;
}

export function ModalTrigger({ children }: ModalTriggerProps) {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('ModalTrigger must be used within Modal');

  return <div onClick={() => context.setOpen(true)}>{children}</div>;
}

export interface ModalContentProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function ModalContent({ children, title, description }: ModalContentProps) {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('ModalContent must be used within Modal');

  if (!context.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={() => context.setOpen(false)} />

      {/* Content */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md mx-4',
          'bg-white dark:bg-neutral-950 rounded-lg shadow-xl',
          'border border-neutral-200 dark:border-neutral-800'
        )}
      >
        {(title || description) && (
          <div className="px-6 pt-6 pb-2">
            {title && (
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

export interface ModalFooterProps {
  children: React.ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3">{children}</div>;
}
