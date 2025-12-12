/**
 * PropEditor - Visual property editor panel
 *
 * Displays editable props for the currently selected component.
 * Uses PROP_CONSTRAINTS to show valid options as dropdowns.
 */

import { useState, useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import { getAllowedValues, FREE_FORM_PROPS, FUNCTION_PROPS, PROP_CONSTRAINTS } from '../lib/prop-constraints';
import { syncPropChange } from '../lib/code-sync';
import type { ParsedComponent, ParsedProp } from '../lib/component-parser';

interface PropEditorProps {
  selectedComponent: ParsedComponent | null;
  onPropChange?: (propName: string, newValue: string | number | boolean) => void;
}

export function PropEditor({ selectedComponent, onPropChange }: PropEditorProps) {
  const project = useAppStore((state) => state.project);
  const [editingProp, setEditingProp] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handlePropChange = useCallback(
    async (propName: string, newValue: string | number | boolean) => {
      if (!project || !selectedComponent) return;

      setIsSaving(true);
      try {
        await syncPropChange(
          project.path,
          selectedComponent.line,
          selectedComponent.column,
          propName,
          newValue
        );
        onPropChange?.(propName, newValue);
      } catch (err) {
        console.error('Failed to update prop:', err);
      } finally {
        setIsSaving(false);
        setEditingProp(null);
      }
    },
    [project, selectedComponent, onPropChange]
  );

  const handleStartEdit = (prop: ParsedProp) => {
    setEditingProp(prop.name);
    setTempValue(String(prop.value ?? ''));
  };

  const handleFinishEdit = (propName: string) => {
    if (tempValue !== '') {
      handlePropChange(propName, tempValue);
    }
    setEditingProp(null);
  };

  if (!selectedComponent) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-50">
            Properties
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 text-neutral-500 dark:text-neutral-400 text-sm text-center">
          <div>
            <p className="mb-2">No component selected</p>
            <p className="text-xs">Click a component in the preview to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  const allowedProps = getAllAllowedProps(selectedComponent.name);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
            {selectedComponent.name}
          </span>
          <span className="text-xs text-neutral-400">
            Line {selectedComponent.line}
          </span>
        </div>
      </div>

      {/* Props List */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Current Props */}
        {selectedComponent.props.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-2">
              Current Props
            </h3>
            <div className="space-y-2">
              {selectedComponent.props.map((prop) => (
                <PropField
                  key={prop.name}
                  componentName={selectedComponent.name}
                  prop={prop}
                  isEditing={editingProp === prop.name}
                  tempValue={tempValue}
                  isSaving={isSaving}
                  onStartEdit={() => handleStartEdit(prop)}
                  onTempValueChange={setTempValue}
                  onFinishEdit={() => handleFinishEdit(prop.name)}
                  onValueChange={(value) => handlePropChange(prop.name, value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Props (not yet set) */}
        {allowedProps.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-2">
              Available Props
            </h3>
            <div className="space-y-1">
              {allowedProps
                .filter((prop) => !selectedComponent.props.some((p) => p.name === prop))
                .map((propName) => (
                  <AddPropButton
                    key={propName}
                    componentName={selectedComponent.name}
                    propName={propName}
                    onAdd={(value) => handlePropChange(propName, value)}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 border-t border-primary-200 dark:border-primary-800">
          <p className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-2">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving changes...
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual prop field editor
 */
interface PropFieldProps {
  componentName: string;
  prop: ParsedProp;
  isEditing: boolean;
  tempValue: string;
  isSaving: boolean;
  onStartEdit: () => void;
  onTempValueChange: (value: string) => void;
  onFinishEdit: () => void;
  onValueChange: (value: string | number | boolean) => void;
}

function PropField({
  componentName,
  prop,
  isEditing,
  tempValue,
  isSaving,
  onStartEdit,
  onTempValueChange,
  onFinishEdit,
  onValueChange,
}: PropFieldProps) {
  const allowedValues = getAllowedValues(componentName, prop.name);
  const isFreeForm = FREE_FORM_PROPS.has(prop.name);
  const isFunction = FUNCTION_PROPS.has(prop.name);
  const isExpression = prop.type === 'expression';

  // Function props and expressions can't be edited
  if (isFunction || isExpression) {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded bg-neutral-50 dark:bg-neutral-900">
        <span className="text-sm text-neutral-600 dark:text-neutral-300">{prop.name}</span>
        <span className="text-xs text-neutral-400 italic">
          {isFunction ? '(function)' : '(expression)'}
        </span>
      </div>
    );
  }

  // Constrained values use dropdown
  if (allowedValues) {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded bg-neutral-50 dark:bg-neutral-900">
        <span className="text-sm text-neutral-600 dark:text-neutral-300">{prop.name}</span>
        <select
          value={String(prop.value)}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={isSaving}
          className="text-sm px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700
                     bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50
                     focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
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

  // Boolean props use toggle
  if (prop.type === 'boolean') {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded bg-neutral-50 dark:bg-neutral-900">
        <span className="text-sm text-neutral-600 dark:text-neutral-300">{prop.name}</span>
        <button
          onClick={() => onValueChange(!prop.value)}
          disabled={isSaving}
          className={`w-10 h-5 rounded-full transition-colors relative ${
            prop.value
              ? 'bg-primary-500'
              : 'bg-neutral-300 dark:bg-neutral-600'
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              prop.value ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    );
  }

  // Free-form text props use input
  if (isFreeForm || prop.type === 'string') {
    return (
      <div className="py-2 px-3 rounded bg-neutral-50 dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-neutral-600 dark:text-neutral-300">{prop.name}</span>
        </div>
        {isEditing ? (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => onTempValueChange(e.target.value)}
            onBlur={onFinishEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onFinishEdit();
              if (e.key === 'Escape') {
                onTempValueChange(String(prop.value ?? ''));
                onFinishEdit();
              }
            }}
            autoFocus
            disabled={isSaving}
            className="w-full text-sm px-2 py-1 rounded border border-primary-500
                       bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        ) : (
          <button
            onClick={onStartEdit}
            className="w-full text-left text-sm px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700
                       bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50
                       hover:border-primary-400 dark:hover:border-primary-500 transition-colors truncate"
          >
            {String(prop.value) || <span className="text-neutral-400 italic">empty</span>}
          </button>
        )}
      </div>
    );
  }

  // Number props use number input
  if (prop.type === 'number') {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded bg-neutral-50 dark:bg-neutral-900">
        <span className="text-sm text-neutral-600 dark:text-neutral-300">{prop.name}</span>
        <input
          type="number"
          value={prop.value as number}
          onChange={(e) => onValueChange(Number(e.target.value))}
          disabled={isSaving}
          className="w-20 text-sm px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700
                     bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50
                     focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        />
      </div>
    );
  }

  return null;
}

/**
 * Button to add a new prop
 */
interface AddPropButtonProps {
  componentName: string;
  propName: string;
  onAdd: (value: string | number | boolean) => void;
}

function AddPropButton({ componentName, propName, onAdd }: AddPropButtonProps) {
  const allowedValues = getAllowedValues(componentName, propName);

  // Use first value as default
  const defaultValue = allowedValues?.[0] || '';

  return (
    <button
      onClick={() => onAdd(defaultValue)}
      className="w-full flex items-center justify-between py-1.5 px-3 rounded text-sm
                 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200
                 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
    >
      <span>{propName}</span>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}

/**
 * Get all allowed prop names for a component
 */
function getAllAllowedProps(componentName: string): string[] {
  const constraints = PROP_CONSTRAINTS[componentName];
  return constraints ? Object.keys(constraints) : [];
}
