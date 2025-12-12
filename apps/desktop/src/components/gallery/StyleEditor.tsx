/**
 * StyleEditor - Visual customization panel for components
 *
 * Allows users to tweak visual properties like colors, spacing,
 * borders, and typography. Supports both raw colors and token references.
 * Saves changes to the active theme.
 */

import { useState, useEffect, useCallback } from 'react';
import { useGalleryStore } from '../../stores/gallery-store';
import { useAppStore } from '../../stores/app-store';
import type { ComponentDefinition } from '../../lib/component-registry';
import type {
  StyleValue,
  ComponentStyleOverrides,
  ColorTokens,
  Theme,
} from '../../lib/theme';
import {
  COLOR_TOKEN_OPTIONS,
  COLOR_SHADE_OPTIONS,
  generateColorScale,
  resolveStyleValue,
  getComponentStyles,
  updateComponentStyles,
  saveTheme,
  DEFAULT_THEME,
} from '../../lib/theme';

interface StyleEditorProps {
  componentDef: ComponentDefinition;
}

// Re-export for backward compatibility
export type { ComponentStyleOverrides as StyleOverrides };

// Preset options for various style properties
const BORDER_RADIUS_OPTIONS = [
  { label: 'None', value: '0' },
  { label: 'Small', value: '4px' },
  { label: 'Medium', value: '6px' },
  { label: 'Large', value: '8px' },
  { label: 'XL', value: '12px' },
  { label: 'Full', value: '9999px' },
];

const PADDING_OPTIONS = [
  { label: 'None', value: '0' },
  { label: 'XS', value: '4px' },
  { label: 'SM', value: '8px' },
  { label: 'MD', value: '12px' },
  { label: 'LG', value: '16px' },
  { label: 'XL', value: '24px' },
];

const FONT_SIZE_OPTIONS = [
  { label: 'XS', value: '12px' },
  { label: 'SM', value: '14px' },
  { label: 'Base', value: '16px' },
  { label: 'LG', value: '18px' },
  { label: 'XL', value: '20px' },
  { label: '2XL', value: '24px' },
];

const FONT_WEIGHT_OPTIONS = [
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
];

const SHADOW_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Small', value: '0 1px 2px rgba(0,0,0,0.05)' },
  { label: 'Medium', value: '0 4px 6px rgba(0,0,0,0.1)' },
  { label: 'Large', value: '0 10px 15px rgba(0,0,0,0.1)' },
  { label: 'XL', value: '0 20px 25px rgba(0,0,0,0.15)' },
];

const BORDER_WIDTH_OPTIONS = [
  { label: 'None', value: '0' },
  { label: '1px', value: '1px' },
  { label: '2px', value: '2px' },
  { label: '3px', value: '3px' },
];

// Color style keys
type ColorStyleKey = 'backgroundColor' | 'textColor' | 'borderColor' | 'hoverBackgroundColor' | 'hoverTextColor';

// Define which style properties are relevant for each component layer
function getRelevantStyles(componentDef: ComponentDefinition): (keyof ComponentStyleOverrides)[] {
  switch (componentDef.layer) {
    case 'elements':
      return [
        'backgroundColor',
        'textColor',
        'borderColor',
        'hoverBackgroundColor',
        'paddingX',
        'paddingY',
        'borderRadius',
        'borderWidth',
        'fontSize',
        'fontWeight',
        'shadow',
      ];
    case 'primitives':
      if (componentDef.name === 'Text') {
        return ['textColor', 'fontSize', 'fontWeight'];
      }
      return ['backgroundColor', 'borderColor', 'borderRadius', 'borderWidth', 'shadow'];
    case 'components':
      return ['backgroundColor', 'borderColor', 'borderRadius', 'borderWidth', 'shadow'];
    default:
      return [];
  }
}

export function StyleEditor({ componentDef }: StyleEditorProps) {
  const project = useAppStore((state) => state.project);
  const themes = useAppStore((state) => state.themes);
  const activeThemeId = useAppStore((state) => state.activeThemeId);
  const updateTheme = useAppStore((state) => state.updateTheme);

  const styleOverrides = useGalleryStore((state) => state.styleOverrides);
  const setStyleOverrides = useGalleryStore((state) => state.setStyleOverrides);
  const resetStyles = useGalleryStore((state) => state.resetStyles);

  // Get active theme
  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? DEFAULT_THEME;

  // Load styles from theme when component changes
  useEffect(() => {
    const savedStyles = getComponentStyles(activeTheme, componentDef.name);
    if (savedStyles) {
      setStyleOverrides(savedStyles);
    } else {
      resetStyles();
    }
  }, [componentDef.name, activeTheme, setStyleOverrides, resetStyles]);

  // Save styles to theme
  const saveToTheme = useCallback(async () => {
    if (!project || activeTheme.id === 'default') {
      console.log('[StyleEditor] Cannot save to default theme or no project');
      return;
    }

    const updated = updateComponentStyles(activeTheme, componentDef.name, styleOverrides);
    updateTheme(activeTheme.id, updated);
    await saveTheme(project.path, updated);
    console.log('[StyleEditor] Saved styles to theme:', activeTheme.name);
  }, [project, activeTheme, componentDef.name, styleOverrides, updateTheme]);

  // Handle color style change
  const handleColorChange = useCallback(
    (key: ColorStyleKey, value: StyleValue | undefined) => {
      setStyleOverrides({
        ...styleOverrides,
        [key]: value,
      });
    },
    [styleOverrides, setStyleOverrides]
  );

  // Handle simple style change
  const handleStyleChange = useCallback(
    (key: keyof ComponentStyleOverrides, value: string | undefined) => {
      setStyleOverrides({
        ...styleOverrides,
        [key]: value || undefined,
      });
    },
    [styleOverrides, setStyleOverrides]
  );

  // Handle reset
  const handleReset = useCallback(() => {
    resetStyles();
  }, [resetStyles]);

  const relevantStyles = getRelevantStyles(componentDef);

  if (relevantStyles.length === 0) {
    return (
      <div className="p-4 text-center text-neutral-500 dark:text-neutral-400 text-sm">
        No customizable styles for this component
      </div>
    );
  }

  const isDefaultTheme = activeTheme.id === 'default';

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Styles
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Reset
          </button>
          {!isDefaultTheme && (
            <button
              onClick={saveToTheme}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
            >
              Save to Theme
            </button>
          )}
        </div>
      </div>

      {isDefaultTheme && (
        <div className="mb-4 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
          Create a new theme to save style changes
        </div>
      )}

      <div className="space-y-4">
        {/* Colors Section */}
        {(relevantStyles.includes('backgroundColor') ||
          relevantStyles.includes('textColor') ||
          relevantStyles.includes('borderColor')) && (
          <div>
            <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Colors
            </h4>
            <div className="space-y-3">
              {relevantStyles.includes('backgroundColor') && (
                <ColorTokenInput
                  label="Background"
                  value={styleOverrides.backgroundColor}
                  theme={activeTheme}
                  onChange={(v) => handleColorChange('backgroundColor', v)}
                />
              )}
              {relevantStyles.includes('textColor') && (
                <ColorTokenInput
                  label="Text"
                  value={styleOverrides.textColor}
                  theme={activeTheme}
                  onChange={(v) => handleColorChange('textColor', v)}
                />
              )}
              {relevantStyles.includes('borderColor') && (
                <ColorTokenInput
                  label="Border"
                  value={styleOverrides.borderColor}
                  theme={activeTheme}
                  onChange={(v) => handleColorChange('borderColor', v)}
                />
              )}
              {relevantStyles.includes('hoverBackgroundColor') && (
                <ColorTokenInput
                  label="Hover BG"
                  value={styleOverrides.hoverBackgroundColor}
                  theme={activeTheme}
                  onChange={(v) => handleColorChange('hoverBackgroundColor', v)}
                />
              )}
            </div>
          </div>
        )}

        {/* Spacing Section */}
        {(relevantStyles.includes('paddingX') || relevantStyles.includes('paddingY')) && (
          <div>
            <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Spacing
            </h4>
            <div className="space-y-3">
              {relevantStyles.includes('paddingX') && (
                <SelectInput
                  label="Padding X"
                  value={styleOverrides.paddingX || ''}
                  options={PADDING_OPTIONS}
                  onChange={(v) => handleStyleChange('paddingX', v)}
                />
              )}
              {relevantStyles.includes('paddingY') && (
                <SelectInput
                  label="Padding Y"
                  value={styleOverrides.paddingY || ''}
                  options={PADDING_OPTIONS}
                  onChange={(v) => handleStyleChange('paddingY', v)}
                />
              )}
            </div>
          </div>
        )}

        {/* Border Section */}
        {(relevantStyles.includes('borderRadius') || relevantStyles.includes('borderWidth')) && (
          <div>
            <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Border
            </h4>
            <div className="space-y-3">
              {relevantStyles.includes('borderRadius') && (
                <SelectInput
                  label="Radius"
                  value={styleOverrides.borderRadius || ''}
                  options={BORDER_RADIUS_OPTIONS}
                  onChange={(v) => handleStyleChange('borderRadius', v)}
                />
              )}
              {relevantStyles.includes('borderWidth') && (
                <SelectInput
                  label="Width"
                  value={styleOverrides.borderWidth || ''}
                  options={BORDER_WIDTH_OPTIONS}
                  onChange={(v) => handleStyleChange('borderWidth', v)}
                />
              )}
            </div>
          </div>
        )}

        {/* Typography Section */}
        {(relevantStyles.includes('fontSize') || relevantStyles.includes('fontWeight')) && (
          <div>
            <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Typography
            </h4>
            <div className="space-y-3">
              {relevantStyles.includes('fontSize') && (
                <SelectInput
                  label="Size"
                  value={styleOverrides.fontSize || ''}
                  options={FONT_SIZE_OPTIONS}
                  onChange={(v) => handleStyleChange('fontSize', v)}
                />
              )}
              {relevantStyles.includes('fontWeight') && (
                <SelectInput
                  label="Weight"
                  value={styleOverrides.fontWeight || ''}
                  options={FONT_WEIGHT_OPTIONS}
                  onChange={(v) => handleStyleChange('fontWeight', v)}
                />
              )}
            </div>
          </div>
        )}

        {/* Effects Section */}
        {relevantStyles.includes('shadow') && (
          <div>
            <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Effects
            </h4>
            <div className="space-y-3">
              <SelectInput
                label="Shadow"
                value={styleOverrides.shadow || ''}
                options={SHADOW_OPTIONS}
                onChange={(v) => handleStyleChange('shadow', v)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Color input with token picker
interface ColorTokenInputProps {
  label: string;
  value: StyleValue | undefined;
  theme: Theme;
  onChange: (value: StyleValue | undefined) => void;
}

function ColorTokenInput({ label, value, theme, onChange }: ColorTokenInputProps) {
  const [mode, setMode] = useState<'token' | 'raw'>(value?.type || 'token');
  const [showPicker, setShowPicker] = useState(false);

  // Resolve the current value to a CSS color
  const resolvedColor = resolveStyleValue(value, theme);

  // Handle token selection
  const handleTokenSelect = (tokenKey: keyof ColorTokens, shade: string) => {
    onChange({
      type: 'token',
      value: tokenKey,
      shade,
    });
    setShowPicker(false);
  };

  // Handle raw color input
  const handleRawChange = (rawValue: string) => {
    if (rawValue) {
      onChange({
        type: 'raw',
        value: rawValue,
      });
    } else {
      onChange(undefined);
    }
  };

  // Clear value
  const handleClear = () => {
    onChange(undefined);
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <label className="w-16 text-xs text-neutral-500 dark:text-neutral-400">{label}</label>

        {/* Color preview button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-8 h-8 rounded border border-neutral-300 dark:border-neutral-600 overflow-hidden flex-shrink-0 relative"
          style={{ backgroundColor: resolvedColor || 'transparent' }}
        >
          {!resolvedColor && (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-xs">
              --
            </div>
          )}
        </button>

        {/* Value display */}
        <div className="flex-1 text-xs">
          {value?.type === 'token' ? (
            <span className="text-primary-600 dark:text-primary-400">
              {value.value}-{value.shade || '500'}
            </span>
          ) : value?.type === 'raw' ? (
            <span className="font-mono text-neutral-600 dark:text-neutral-400">
              {value.value}
            </span>
          ) : (
            <span className="text-neutral-400">Auto</span>
          )}
        </div>

        {/* Clear button */}
        {value && (
          <button
            onClick={handleClear}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            title="Clear"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Picker dropdown */}
      {showPicker && (
        <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
          {/* Mode toggle */}
          <div className="flex gap-1 mb-3 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
            <button
              onClick={() => setMode('token')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                mode === 'token'
                  ? 'bg-white dark:bg-neutral-700 shadow-sm'
                  : 'text-neutral-500'
              }`}
            >
              Token
            </button>
            <button
              onClick={() => setMode('raw')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                mode === 'raw'
                  ? 'bg-white dark:bg-neutral-700 shadow-sm'
                  : 'text-neutral-500'
              }`}
            >
              Custom
            </button>
          </div>

          {mode === 'token' ? (
            <TokenPicker theme={theme} onSelect={handleTokenSelect} />
          ) : (
            <div className="flex gap-2">
              <input
                type="color"
                value={value?.type === 'raw' ? value.value : '#3b82f6'}
                onChange={(e) => handleRawChange(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={value?.type === 'raw' ? value.value : ''}
                onChange={(e) => handleRawChange(e.target.value)}
                placeholder="#hex or rgb()"
                className="flex-1 px-2 py-1 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded"
              />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setShowPicker(false)}
            className="mt-3 w-full px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// Token picker grid
interface TokenPickerProps {
  theme: Theme;
  onSelect: (token: keyof ColorTokens, shade: string) => void;
}

function TokenPicker({ theme, onSelect }: TokenPickerProps) {
  const [selectedToken, setSelectedToken] = useState<keyof ColorTokens | null>(null);

  // Get color scale for selected token
  const getScale = (tokenKey: keyof ColorTokens) => {
    const baseColor = theme.tokens.colors[tokenKey];
    return generateColorScale(baseColor);
  };

  if (selectedToken) {
    const scale = getScale(selectedToken);
    return (
      <div>
        <button
          onClick={() => setSelectedToken(null)}
          className="mb-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2 capitalize">
          {selectedToken}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {COLOR_SHADE_OPTIONS.map(({ value: shade }) => (
            <button
              key={shade}
              onClick={() => onSelect(selectedToken, shade)}
              className="w-full aspect-square rounded border border-neutral-200 dark:border-neutral-700 hover:ring-2 hover:ring-primary-500 transition-all"
              style={{ backgroundColor: scale[shade] }}
              title={`${selectedToken}-${shade}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-neutral-400">
          <span>50</span>
          <span>950</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {COLOR_TOKEN_OPTIONS.map(({ key, label }) => {
        const baseColor = theme.tokens.colors[key];
        return (
          <button
            key={key}
            onClick={() => setSelectedToken(key)}
            className="flex flex-col items-center gap-1 p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700"
              style={{ backgroundColor: baseColor }}
            />
            <span className="text-[10px] text-neutral-600 dark:text-neutral-400">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Select input for preset options
interface SelectInputProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

function SelectInput({ label, value, options, onChange }: SelectInputProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-16 text-xs text-neutral-500 dark:text-neutral-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Auto</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
