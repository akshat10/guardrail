/**
 * Theme System
 *
 * Manages design token overrides and component defaults.
 * Themes are stored per-project and applied via CSS variables.
 */

import { exists, mkdir, readDir, readTextFile, writeTextFile, remove } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

// Color token definition
export interface ColorTokens {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  muted: string;
}

// Spacing token definition
export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

// Component default props
export interface ComponentDefaults {
  Button?: {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
  };
  Card?: {
    variant?: 'default' | 'outline' | 'filled';
    padding?: 'none' | 'sm' | 'md' | 'lg';
  };
  Input?: {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'filled';
  };
  Badge?: {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
  };
  Text?: {
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  };
  Box?: {
    padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    background?: 'transparent' | 'surface' | 'card' | 'muted' | 'accent' | 'primary';
  };
  Flex?: {
    gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  };
}

// Style value can be a raw value or a token reference
export interface StyleValue {
  type: 'raw' | 'token';
  value: string; // Raw value like "#ff0000" or token key like "primary"
  shade?: string; // For color tokens, optional shade like "500", "600"
}

// Component style overrides - visual customizations
export interface ComponentStyleOverrides {
  // Colors (can be raw or token reference)
  backgroundColor?: StyleValue;
  textColor?: StyleValue;
  borderColor?: StyleValue;
  hoverBackgroundColor?: StyleValue;
  hoverTextColor?: StyleValue;

  // Spacing (raw values)
  paddingX?: string;
  paddingY?: string;

  // Borders
  borderRadius?: string;
  borderWidth?: string;

  // Typography
  fontSize?: string;
  fontWeight?: string;

  // Effects
  shadow?: string;
}

// Per-component styles stored in theme
export type ComponentStyles = {
  [componentName: string]: ComponentStyleOverrides;
};

// Full theme definition
export interface Theme {
  id: string;
  name: string;
  tokens: {
    colors: ColorTokens;
    spacing?: Partial<SpacingTokens>;
  };
  componentDefaults?: ComponentDefaults;
  componentStyles?: ComponentStyles;
  createdAt: string;
  updatedAt: string;
}

// Default color palette based on @guardrail/ui tokens
const DEFAULT_COLORS: ColorTokens = {
  primary: '#3b82f6',     // blue-500
  secondary: '#6b7280',   // gray-500
  success: '#22c55e',     // green-500
  warning: '#f59e0b',     // amber-500
  error: '#ef4444',       // red-500
  background: '#ffffff',  // white
  surface: '#f9fafb',     // gray-50
  muted: '#9ca3af',       // gray-400
};

// Default spacing scale
const DEFAULT_SPACING: SpacingTokens = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
};

// Default theme
export const DEFAULT_THEME: Theme = {
  id: 'default',
  name: 'Default',
  tokens: {
    colors: DEFAULT_COLORS,
    spacing: DEFAULT_SPACING,
  },
  componentDefaults: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Generate a color scale from a base color
 * Creates lighter and darker variants (50-950)
 */
function generateColorScale(baseColor: string): Record<string, string> {
  // Simple algorithm to generate shades
  // In production, use a proper color manipulation library
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const lighten = (value: number, amount: number) => Math.min(255, Math.round(value + (255 - value) * amount));
  const darken = (value: number, amount: number) => Math.max(0, Math.round(value * (1 - amount)));

  const toHex = (rv: number, gv: number, bv: number) =>
    `#${rv.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;

  return {
    '50': toHex(lighten(r, 0.95), lighten(g, 0.95), lighten(b, 0.95)),
    '100': toHex(lighten(r, 0.85), lighten(g, 0.85), lighten(b, 0.85)),
    '200': toHex(lighten(r, 0.7), lighten(g, 0.7), lighten(b, 0.7)),
    '300': toHex(lighten(r, 0.5), lighten(g, 0.5), lighten(b, 0.5)),
    '400': toHex(lighten(r, 0.25), lighten(g, 0.25), lighten(b, 0.25)),
    '500': baseColor,
    '600': toHex(darken(r, 0.15), darken(g, 0.15), darken(b, 0.15)),
    '700': toHex(darken(r, 0.3), darken(g, 0.3), darken(b, 0.3)),
    '800': toHex(darken(r, 0.45), darken(g, 0.45), darken(b, 0.45)),
    '900': toHex(darken(r, 0.6), darken(g, 0.6), darken(b, 0.6)),
    '950': toHex(darken(r, 0.75), darken(g, 0.75), darken(b, 0.75)),
  };
}

/**
 * Generate CSS custom properties from a theme
 */
export function generateCSSVariables(theme: Theme): string {
  const lines: string[] = [':root {'];

  // Generate color scales for each color token
  const colorKeys: (keyof ColorTokens)[] = ['primary', 'secondary', 'success', 'warning', 'error'];

  for (const colorKey of colorKeys) {
    const baseColor = theme.tokens.colors[colorKey];
    const scale = generateColorScale(baseColor);

    for (const [shade, value] of Object.entries(scale)) {
      lines.push(`  --color-${colorKey}-${shade}: ${value};`);
    }
  }

  // Add semantic colors
  lines.push(`  --color-background: ${theme.tokens.colors.background};`);
  lines.push(`  --color-surface: ${theme.tokens.colors.surface};`);
  lines.push(`  --color-muted: ${theme.tokens.colors.muted};`);

  // Add spacing tokens
  if (theme.tokens.spacing) {
    for (const [key, value] of Object.entries(theme.tokens.spacing)) {
      if (value) {
        lines.push(`  --spacing-${key}: ${value};`);
      }
    }
  }

  lines.push('}');

  // Generate Tailwind-compatible utility classes for colors
  lines.push('');
  lines.push('/* Color utility overrides */');

  for (const colorKey of colorKeys) {
    const scale = generateColorScale(theme.tokens.colors[colorKey]);
    for (const [shade, value] of Object.entries(scale)) {
      // Background colors
      lines.push(`.bg-${colorKey}-${shade} { background-color: ${value} !important; }`);
      // Text colors
      lines.push(`.text-${colorKey}-${shade} { color: ${value} !important; }`);
      // Border colors
      lines.push(`.border-${colorKey}-${shade} { border-color: ${value} !important; }`);
    }
  }

  return lines.join('\n');
}

/**
 * Get the themes directory for a project
 */
async function getThemesDir(projectPath: string): Promise<string> {
  return await join(projectPath, 'themes');
}

/**
 * Ensure the themes directory exists
 */
async function ensureThemesDir(projectPath: string): Promise<string> {
  const themesDir = await getThemesDir(projectPath);
  if (!(await exists(themesDir))) {
    await mkdir(themesDir, { recursive: true });
  }
  return themesDir;
}

/**
 * Load all themes for a project
 */
export async function loadThemes(projectPath: string): Promise<Theme[]> {
  const themes: Theme[] = [DEFAULT_THEME];

  try {
    const themesDir = await getThemesDir(projectPath);
    if (!(await exists(themesDir))) {
      return themes;
    }

    const files = await readDir(themesDir);
    for (const file of files) {
      if (file.name?.endsWith('.json')) {
        try {
          const filePath = await join(themesDir, file.name);
          const content = await readTextFile(filePath);
          const theme = JSON.parse(content) as Theme;

          // Don't add duplicate default theme
          if (theme.id !== 'default') {
            themes.push(theme);
          }
        } catch (err) {
          console.error(`[Theme] Failed to load theme ${file.name}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('[Theme] Failed to load themes:', err);
  }

  return themes;
}

/**
 * Save a theme to the project
 */
export async function saveTheme(projectPath: string, theme: Theme): Promise<void> {
  const themesDir = await ensureThemesDir(projectPath);
  const filePath = await join(themesDir, `${theme.id}.json`);

  const updatedTheme: Theme = {
    ...theme,
    updatedAt: new Date().toISOString(),
  };

  await writeTextFile(filePath, JSON.stringify(updatedTheme, null, 2));
  console.log('[Theme] Saved theme:', theme.name);
}

/**
 * Delete a theme from the project
 */
export async function deleteTheme(projectPath: string, themeId: string): Promise<void> {
  if (themeId === 'default') {
    throw new Error('Cannot delete the default theme');
  }

  const themesDir = await getThemesDir(projectPath);
  const filePath = await join(themesDir, `${themeId}.json`);

  if (await exists(filePath)) {
    await remove(filePath);
    console.log('[Theme] Deleted theme:', themeId);
  }
}

/**
 * Create a new theme with a unique ID
 */
export function createTheme(name: string, baseTheme?: Theme): Theme {
  const id = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  return {
    id,
    name,
    tokens: baseTheme?.tokens ?? { ...DEFAULT_THEME.tokens },
    componentDefaults: baseTheme?.componentDefaults ?? {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Duplicate an existing theme
 */
export function duplicateTheme(theme: Theme, newName?: string): Theme {
  return createTheme(
    newName ?? `${theme.name} (Copy)`,
    theme
  );
}

/**
 * Get component defaults from a theme, merged with global defaults
 */
export function getComponentDefaults<T extends keyof ComponentDefaults>(
  theme: Theme,
  componentName: T
): ComponentDefaults[T] | undefined {
  return theme.componentDefaults?.[componentName];
}

/**
 * Update a specific color in a theme
 */
export function updateThemeColor(
  theme: Theme,
  colorKey: keyof ColorTokens,
  value: string
): Theme {
  return {
    ...theme,
    tokens: {
      ...theme.tokens,
      colors: {
        ...theme.tokens.colors,
        [colorKey]: value,
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update spacing in a theme
 */
export function updateThemeSpacing(
  theme: Theme,
  spacingKey: keyof SpacingTokens,
  value: string
): Theme {
  return {
    ...theme,
    tokens: {
      ...theme.tokens,
      spacing: {
        ...theme.tokens.spacing,
        [spacingKey]: value,
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update component defaults in a theme
 */
export function updateComponentDefault<T extends keyof ComponentDefaults>(
  theme: Theme,
  componentName: T,
  defaults: ComponentDefaults[T]
): Theme {
  return {
    ...theme,
    componentDefaults: {
      ...theme.componentDefaults,
      [componentName]: defaults,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Write theme CSS to a file in the project
 */
export async function writeThemeCSS(projectPath: string, theme: Theme): Promise<string> {
  const css = generateCSSVariables(theme);
  const cssPath = await join(projectPath, 'src', 'theme.css');

  // Ensure src directory exists
  const srcDir = await join(projectPath, 'src');
  if (!(await exists(srcDir))) {
    await mkdir(srcDir, { recursive: true });
  }

  await writeTextFile(cssPath, css);
  console.log('[Theme] Wrote theme CSS to:', cssPath);

  return cssPath;
}

/**
 * Resolve a StyleValue to an actual CSS color value
 */
export function resolveStyleValue(
  styleValue: StyleValue | undefined,
  theme: Theme
): string | undefined {
  if (!styleValue) return undefined;

  if (styleValue.type === 'raw') {
    return styleValue.value;
  }

  // Token reference - resolve from theme
  const tokenKey = styleValue.value as keyof ColorTokens;
  const baseColor = theme.tokens.colors[tokenKey];

  if (!baseColor) return undefined;

  // If no shade specified, return the base color (500)
  if (!styleValue.shade || styleValue.shade === '500') {
    return baseColor;
  }

  // Generate the color scale and return the requested shade
  const scale = generateColorScale(baseColor);
  return scale[styleValue.shade];
}

/**
 * Get component styles for a specific component from a theme
 */
export function getComponentStyles(
  theme: Theme,
  componentName: string
): ComponentStyleOverrides | undefined {
  return theme.componentStyles?.[componentName];
}

/**
 * Update component styles in a theme
 */
export function updateComponentStyles(
  theme: Theme,
  componentName: string,
  styles: ComponentStyleOverrides
): Theme {
  return {
    ...theme,
    componentStyles: {
      ...theme.componentStyles,
      [componentName]: styles,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Clear component styles for a specific component
 */
export function clearComponentStyles(
  theme: Theme,
  componentName: string
): Theme {
  const newComponentStyles = { ...theme.componentStyles };
  delete newComponentStyles[componentName];

  return {
    ...theme,
    componentStyles: newComponentStyles,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Color token options for the token picker
 */
export const COLOR_TOKEN_OPTIONS: { key: keyof ColorTokens; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'error', label: 'Error' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'muted', label: 'Muted' },
];

/**
 * Shade options for color tokens
 */
export const COLOR_SHADE_OPTIONS = [
  { value: '50', label: '50 (Lightest)' },
  { value: '100', label: '100' },
  { value: '200', label: '200' },
  { value: '300', label: '300' },
  { value: '400', label: '400' },
  { value: '500', label: '500 (Base)' },
  { value: '600', label: '600' },
  { value: '700', label: '700' },
  { value: '800', label: '800' },
  { value: '900', label: '900' },
  { value: '950', label: '950 (Darkest)' },
];

// Re-export generateColorScale for use in StyleEditor
export { generateColorScale };
