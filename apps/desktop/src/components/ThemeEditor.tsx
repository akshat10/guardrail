/**
 * ThemeEditor - Visual theme customization panel
 *
 * Allows users to:
 * - Switch between themes
 * - Edit color tokens with color pickers
 * - Adjust spacing values
 * - Set component defaults
 * - Create, duplicate, and delete themes
 */

import { useState, useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import type {
  ColorTokens,
  SpacingTokens,
  ComponentDefaults,
} from '../lib/theme';
import {
  createTheme,
  duplicateTheme,
  updateThemeColor,
  updateThemeSpacing,
  updateComponentDefault,
  saveTheme,
  deleteTheme,
  DEFAULT_THEME,
} from '../lib/theme';

// Color token labels for display
const COLOR_LABELS: Record<keyof ColorTokens, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  background: 'Background',
  surface: 'Surface',
  muted: 'Muted Text',
};

// Spacing token labels
const SPACING_LABELS: Record<keyof SpacingTokens, string> = {
  xs: 'Extra Small',
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  xl: 'Extra Large',
  '2xl': '2X Large',
};

// Component options for defaults
const BUTTON_VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'destructive'] as const;
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
const CARD_VARIANTS = ['default', 'outline', 'filled'] as const;
const CARD_PADDINGS = ['none', 'sm', 'md', 'lg'] as const;
const TEXT_SIZES = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'] as const;
const BOX_PADDINGS = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
const BOX_BACKGROUNDS = ['transparent', 'surface', 'card', 'muted', 'accent', 'primary'] as const;
const FLEX_GAPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
const FLEX_DIRECTIONS = ['row', 'column', 'row-reverse', 'column-reverse'] as const;

export function ThemeEditor() {
  const project = useAppStore((state) => state.project);
  const themes = useAppStore((state) => state.themes);
  const activeThemeId = useAppStore((state) => state.activeThemeId);
  const setThemes = useAppStore((state) => state.setThemes);
  const setActiveTheme = useAppStore((state) => state.setActiveTheme);
  const updateTheme = useAppStore((state) => state.updateTheme);

  const [isCreating, setIsCreating] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['colors'])
  );

  // Get active theme
  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? DEFAULT_THEME;

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Handle color change
  const handleColorChange = useCallback(
    async (colorKey: keyof ColorTokens, value: string) => {
      const updated = updateThemeColor(activeTheme, colorKey, value);
      updateTheme(activeTheme.id, updated);

      // Save non-default themes to disk if we have a valid project path
      if (activeTheme.id !== 'default' && project?.path) {
        try {
          await saveTheme(project.path, updated);
        } catch (err) {
          console.warn('[ThemeEditor] Could not save theme to disk:', err);
        }
      }
    },
    [activeTheme, project, updateTheme]
  );

  // Handle spacing change
  const handleSpacingChange = useCallback(
    async (spacingKey: keyof SpacingTokens, value: string) => {
      const updated = updateThemeSpacing(activeTheme, spacingKey, value);
      updateTheme(activeTheme.id, updated);

      if (activeTheme.id !== 'default' && project?.path) {
        try {
          await saveTheme(project.path, updated);
        } catch (err) {
          console.warn('[ThemeEditor] Could not save theme to disk:', err);
        }
      }
    },
    [activeTheme, project, updateTheme]
  );

  // Handle component default change
  const handleComponentDefaultChange = useCallback(
    async <T extends keyof ComponentDefaults>(
      component: T,
      defaults: ComponentDefaults[T]
    ) => {
      const updated = updateComponentDefault(activeTheme, component, defaults);
      updateTheme(activeTheme.id, updated);

      if (activeTheme.id !== 'default' && project?.path) {
        try {
          await saveTheme(project.path, updated);
        } catch (err) {
          console.warn('[ThemeEditor] Could not save theme to disk:', err);
        }
      }
    },
    [activeTheme, project, updateTheme]
  );

  // Create new theme
  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) return;

    const newTheme = createTheme(newThemeName.trim());

    // Save to disk if we have a valid project path
    if (project?.path) {
      try {
        await saveTheme(project.path, newTheme);
      } catch (err) {
        console.warn('[ThemeEditor] Could not save theme to disk:', err);
        // Continue anyway - theme will be stored in memory
      }
    }

    setThemes([...themes, newTheme]);
    setActiveTheme(newTheme.id);
    setNewThemeName('');
    setIsCreating(false);
  };

  // Duplicate theme
  const handleDuplicateTheme = async () => {
    const duplicated = duplicateTheme(activeTheme);

    // Save to disk if we have a valid project path
    if (project?.path) {
      try {
        await saveTheme(project.path, duplicated);
      } catch (err) {
        console.warn('[ThemeEditor] Could not save theme to disk:', err);
      }
    }

    setThemes([...themes, duplicated]);
    setActiveTheme(duplicated.id);
  };

  // Delete theme
  const handleDeleteTheme = async () => {
    if (activeTheme.id === 'default') return;

    if (!confirm(`Delete theme "${activeTheme.name}"?`)) return;

    // Delete from disk if we have a valid project path
    if (project?.path) {
      try {
        await deleteTheme(project.path, activeTheme.id);
      } catch (err) {
        console.warn('[ThemeEditor] Could not delete theme from disk:', err);
      }
    }

    setThemes(themes.filter((t) => t.id !== activeTheme.id));
    setActiveTheme('default');
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Theme Editor
        </h2>
      </div>

      {/* Theme selector */}
      <div className="flex-none px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
          Active Theme
        </label>
        <select
          value={activeThemeId ?? 'default'}
          onChange={(e) => setActiveTheme(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>

        {/* Theme actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setIsCreating(true)}
            className="flex-1 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            New
          </button>
          <button
            onClick={handleDuplicateTheme}
            className="flex-1 px-2 py-1 text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={handleDeleteTheme}
            disabled={activeTheme.id === 'default'}
            className="flex-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>

        {/* New theme input */}
        {isCreating && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="Theme name..."
              className="flex-1 px-2 py-1 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTheme();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <button
              onClick={handleCreateTheme}
              className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-2 py-1 text-xs bg-neutral-200 dark:bg-neutral-700 rounded hover:bg-neutral-300 dark:hover:bg-neutral-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        {/* Colors Section */}
        <CollapsibleSection
          title="Colors"
          isExpanded={expandedSections.has('colors')}
          onToggle={() => toggleSection('colors')}
        >
          <div className="space-y-3">
            {(Object.keys(COLOR_LABELS) as (keyof ColorTokens)[]).map((key) => (
              <ColorInput
                key={key}
                label={COLOR_LABELS[key]}
                value={activeTheme.tokens.colors[key]}
                onChange={(value) => handleColorChange(key, value)}
              />
            ))}
          </div>
        </CollapsibleSection>

        {/* Spacing Section */}
        <CollapsibleSection
          title="Spacing"
          isExpanded={expandedSections.has('spacing')}
          onToggle={() => toggleSection('spacing')}
        >
          <div className="space-y-3">
            {(Object.keys(SPACING_LABELS) as (keyof SpacingTokens)[]).map((key) => (
              <SpacingInput
                key={key}
                label={SPACING_LABELS[key]}
                value={activeTheme.tokens.spacing?.[key] ?? DEFAULT_THEME.tokens.spacing?.[key] ?? ''}
                onChange={(value) => handleSpacingChange(key, value)}
              />
            ))}
          </div>
        </CollapsibleSection>

        {/* Component Defaults Section */}
        <CollapsibleSection
          title="Component Defaults"
          isExpanded={expandedSections.has('components')}
          onToggle={() => toggleSection('components')}
        >
          <div className="space-y-4">
            {/* Button defaults */}
            <div>
              <h4 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Button
              </h4>
              <div className="space-y-2">
                <SelectInput
                  label="Default Variant"
                  value={activeTheme.componentDefaults?.Button?.variant ?? ''}
                  options={BUTTON_VARIANTS}
                  onChange={(value) =>
                    handleComponentDefaultChange('Button', {
                      ...activeTheme.componentDefaults?.Button,
                      variant: value as typeof BUTTON_VARIANTS[number] | undefined,
                    })
                  }
                />
                <SelectInput
                  label="Default Size"
                  value={activeTheme.componentDefaults?.Button?.size ?? ''}
                  options={BUTTON_SIZES}
                  onChange={(value) =>
                    handleComponentDefaultChange('Button', {
                      ...activeTheme.componentDefaults?.Button,
                      size: value as typeof BUTTON_SIZES[number] | undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Card defaults */}
            <div>
              <h4 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Card
              </h4>
              <div className="space-y-2">
                <SelectInput
                  label="Default Variant"
                  value={activeTheme.componentDefaults?.Card?.variant ?? ''}
                  options={CARD_VARIANTS}
                  onChange={(value) =>
                    handleComponentDefaultChange('Card', {
                      ...activeTheme.componentDefaults?.Card,
                      variant: value as typeof CARD_VARIANTS[number] | undefined,
                    })
                  }
                />
                <SelectInput
                  label="Default Padding"
                  value={activeTheme.componentDefaults?.Card?.padding ?? ''}
                  options={CARD_PADDINGS}
                  onChange={(value) =>
                    handleComponentDefaultChange('Card', {
                      ...activeTheme.componentDefaults?.Card,
                      padding: value as typeof CARD_PADDINGS[number] | undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Text defaults */}
            <div>
              <h4 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Text
              </h4>
              <div className="space-y-2">
                <SelectInput
                  label="Default Size"
                  value={activeTheme.componentDefaults?.Text?.size ?? ''}
                  options={TEXT_SIZES}
                  onChange={(value) =>
                    handleComponentDefaultChange('Text', {
                      ...activeTheme.componentDefaults?.Text,
                      size: value as typeof TEXT_SIZES[number] | undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Box defaults */}
            <div>
              <h4 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Box
              </h4>
              <div className="space-y-2">
                <SelectInput
                  label="Default Padding"
                  value={activeTheme.componentDefaults?.Box?.padding ?? ''}
                  options={BOX_PADDINGS}
                  onChange={(value) =>
                    handleComponentDefaultChange('Box', {
                      ...activeTheme.componentDefaults?.Box,
                      padding: value as typeof BOX_PADDINGS[number] | undefined,
                    })
                  }
                />
                <SelectInput
                  label="Default Background"
                  value={activeTheme.componentDefaults?.Box?.background ?? ''}
                  options={BOX_BACKGROUNDS}
                  onChange={(value) =>
                    handleComponentDefaultChange('Box', {
                      ...activeTheme.componentDefaults?.Box,
                      background: value as typeof BOX_BACKGROUNDS[number] | undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Flex defaults */}
            <div>
              <h4 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Flex
              </h4>
              <div className="space-y-2">
                <SelectInput
                  label="Default Gap"
                  value={activeTheme.componentDefaults?.Flex?.gap ?? ''}
                  options={FLEX_GAPS}
                  onChange={(value) =>
                    handleComponentDefaultChange('Flex', {
                      ...activeTheme.componentDefaults?.Flex,
                      gap: value as typeof FLEX_GAPS[number] | undefined,
                    })
                  }
                />
                <SelectInput
                  label="Default Direction"
                  value={activeTheme.componentDefaults?.Flex?.direction ?? ''}
                  options={FLEX_DIRECTIONS}
                  onChange={(value) =>
                    handleComponentDefaultChange('Flex', {
                      ...activeTheme.componentDefaults?.Flex,
                      direction: value as typeof FLEX_DIRECTIONS[number] | undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

// Collapsible section component
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
      >
        {title}
        <svg
          className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

// Color input with color picker
interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 rounded border border-neutral-300 dark:border-neutral-600 overflow-hidden">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
        />
        <div
          className="w-full h-full"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-neutral-500 dark:text-neutral-400">
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-xs font-mono text-neutral-700 dark:text-neutral-300 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}

// Spacing input
interface SpacingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function SpacingInput({ label, value, onChange }: SpacingInputProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-neutral-500 dark:text-neutral-400">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 px-2 py-1 text-xs font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );
}

// Select input for component defaults
interface SelectInputProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string | undefined) => void;
}

function SelectInput({ label, value, options, onChange }: SelectInputProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-neutral-500 dark:text-neutral-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-28 px-2 py-1 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Default</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
