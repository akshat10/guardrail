/**
 * QuickEditor - Inline quick edit popover
 *
 * A floating popover that appears when hovering over components
 * in the preview, showing quick toggles for common props.
 */

import { useState, useEffect, useRef } from 'react';
import { getAllowedValues } from '../lib/prop-constraints';
import type { ParsedComponent } from '../lib/component-parser';

interface QuickEditorProps {
  component: ParsedComponent;
  position: { x: number; y: number };
  onPropChange: (propName: string, newValue: string | number | boolean) => void;
  onClose: () => void;
  onSelectComponent: () => void;
}

// Common props to show in quick editor for each component type
const QUICK_PROPS: Record<string, string[]> = {
  Box: ['padding', 'background', 'radius'],
  Flex: ['direction', 'gap', 'align'],
  Grid: ['columns', 'gap'],
  Text: ['size', 'weight', 'color'],
  Spacer: ['size'],
  Button: ['variant', 'size'],
  Input: ['size'],
  Badge: ['variant'],
  Avatar: ['size'],
  Card: ['variant'],
  Alert: ['variant'],
};

export function QuickEditor({
  component,
  position,
  onPropChange,
  onClose,
  onSelectComponent,
}: QuickEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const padding = 8;

      let x = position.x;
      let y = position.y;

      // Keep within horizontal bounds
      if (x + rect.width > window.innerWidth - padding) {
        x = window.innerWidth - rect.width - padding;
      }
      if (x < padding) {
        x = padding;
      }

      // Keep within vertical bounds
      if (y + rect.height > window.innerHeight - padding) {
        y = position.y - rect.height - 8; // Position above instead
      }
      if (y < padding) {
        y = padding;
      }

      setAdjustedPosition({ x, y });
    }
  }, [position]);

  // Get quick props for this component type
  const quickProps = QUICK_PROPS[component.name] || [];

  // Get current values for quick props
  const propValues: Record<string, string | number | boolean | null> = {};
  for (const propName of quickProps) {
    const existingProp = component.props.find((p) => p.name === propName);
    propValues[propName] = existingProp?.value ?? null;
  }

  if (quickProps.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        minWidth: 200,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {component.name}
        </span>
        <button
          onClick={onSelectComponent}
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
        >
          Edit all props
        </button>
      </div>

      {/* Quick Props */}
      <div className="p-2 space-y-2">
        {quickProps.map((propName) => {
          const allowedValues = getAllowedValues(component.name, propName);
          const currentValue = propValues[propName];

          if (!allowedValues) return null;

          return (
            <QuickPropField
              key={propName}
              propName={propName}
              currentValue={currentValue}
              allowedValues={allowedValues}
              onChange={(value) => onPropChange(propName, value)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface QuickPropFieldProps {
  propName: string;
  currentValue: string | number | boolean | null;
  allowedValues: string[];
  onChange: (value: string) => void;
}

function QuickPropField({
  propName,
  currentValue,
  allowedValues,
  onChange,
}: QuickPropFieldProps) {
  // For props with few values, show as pill buttons
  if (allowedValues.length <= 5) {
    return (
      <div>
        <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
          {propName}
        </label>
        <div className="flex flex-wrap gap-1">
          {allowedValues.map((value) => (
            <button
              key={value}
              onClick={() => onChange(value)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                currentValue === value
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // For props with many values, use dropdown
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-neutral-500 dark:text-neutral-400">
        {propName}
      </label>
      <select
        value={currentValue as string || allowedValues[0]}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700
                   bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50
                   focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {allowedValues.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Selection overlay that appears when a component is selected
 */
interface SelectionOverlayProps {
  rect: DOMRect;
  label: string;
}

export function SelectionOverlay({ rect, label }: SelectionOverlayProps) {
  return (
    <>
      {/* Selection border */}
      <div
        className="fixed pointer-events-none border-2 border-primary-500 rounded"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        }}
      />
      {/* Label */}
      <div
        className="fixed pointer-events-none px-2 py-0.5 text-xs font-medium bg-primary-500 text-white rounded-t"
        style={{
          left: rect.left,
          top: rect.top - 20,
        }}
      >
        {label}
      </div>
    </>
  );
}

/**
 * Hover highlight that appears when hovering over components
 */
interface HoverHighlightProps {
  rect: DOMRect;
}

export function HoverHighlight({ rect }: HoverHighlightProps) {
  return (
    <div
      className="fixed pointer-events-none bg-primary-500/10 border border-primary-500/30 rounded"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}
