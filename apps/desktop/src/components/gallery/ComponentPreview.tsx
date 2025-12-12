import { useGalleryStore } from '../../stores/gallery-store';
import { useAppStore } from '../../stores/app-store';
import type { ComponentDefinition } from '../../lib/component-registry';
import type { ComponentStyleOverrides } from '../../lib/theme';
import { resolveStyleValue, DEFAULT_THEME } from '../../lib/theme';

interface ComponentPreviewProps {
  componentDef: ComponentDefinition;
  propValues: Record<string, unknown>;
}

/**
 * Generate CSS overrides for the preview container
 * Resolves StyleValue tokens to actual CSS colors using the active theme
 */
function generateStyleOverrideCSS(
  overrides: ComponentStyleOverrides,
  theme: typeof DEFAULT_THEME
): string {
  const rules: string[] = [];

  // Target all interactive elements within the preview
  const selectors = [
    '.guardrail-preview-container > *',
    '.guardrail-preview-container button',
    '.guardrail-preview-container input',
    '.guardrail-preview-container select',
    '.guardrail-preview-container textarea',
    '.guardrail-preview-container [class*="card"]',
    '.guardrail-preview-container [class*="alert"]',
    '.guardrail-preview-container [class*="badge"]',
  ].join(', ');

  const hoverSelectors = [
    '.guardrail-preview-container button:hover',
    '.guardrail-preview-container [role="button"]:hover',
  ].join(', ');

  // Build base styles - resolve StyleValue tokens for colors
  const baseStyles: string[] = [];

  const bgColor = resolveStyleValue(overrides.backgroundColor, theme);
  if (bgColor) {
    baseStyles.push(`background-color: ${bgColor} !important`);
  }

  const textColor = resolveStyleValue(overrides.textColor, theme);
  if (textColor) {
    baseStyles.push(`color: ${textColor} !important`);
  }

  const borderColor = resolveStyleValue(overrides.borderColor, theme);
  if (borderColor) {
    baseStyles.push(`border-color: ${borderColor} !important`);
  }

  if (overrides.borderRadius) {
    baseStyles.push(`border-radius: ${overrides.borderRadius} !important`);
  }
  if (overrides.borderWidth) {
    baseStyles.push(`border-width: ${overrides.borderWidth} !important`);
    baseStyles.push(`border-style: solid !important`);
  }
  if (overrides.paddingX) {
    baseStyles.push(`padding-left: ${overrides.paddingX} !important`);
    baseStyles.push(`padding-right: ${overrides.paddingX} !important`);
  }
  if (overrides.paddingY) {
    baseStyles.push(`padding-top: ${overrides.paddingY} !important`);
    baseStyles.push(`padding-bottom: ${overrides.paddingY} !important`);
  }
  if (overrides.fontSize) {
    baseStyles.push(`font-size: ${overrides.fontSize} !important`);
  }
  if (overrides.fontWeight) {
    baseStyles.push(`font-weight: ${overrides.fontWeight} !important`);
  }
  if (overrides.shadow) {
    baseStyles.push(`box-shadow: ${overrides.shadow} !important`);
  }

  if (baseStyles.length > 0) {
    rules.push(`${selectors} { ${baseStyles.join('; ')} }`);
  }

  // Build hover styles - resolve StyleValue tokens for colors
  const hoverStyles: string[] = [];

  const hoverBgColor = resolveStyleValue(overrides.hoverBackgroundColor, theme);
  if (hoverBgColor) {
    hoverStyles.push(`background-color: ${hoverBgColor} !important`);
  }

  const hoverTextColor = resolveStyleValue(overrides.hoverTextColor, theme);
  if (hoverTextColor) {
    hoverStyles.push(`color: ${hoverTextColor} !important`);
  }

  if (hoverStyles.length > 0) {
    rules.push(`${hoverSelectors} { ${hoverStyles.join('; ')} }`);
  }

  return rules.join('\n');
}

export function ComponentPreview({ componentDef, propValues }: ComponentPreviewProps) {
  const Component = componentDef.component;
  const styleOverrides = useGalleryStore((state) => state.styleOverrides);

  // Get active theme for resolving token colors
  const themes = useAppStore((state) => state.themes);
  const activeThemeId = useAppStore((state) => state.activeThemeId);
  const activeTheme = themes.find((t) => t.id === activeThemeId) || DEFAULT_THEME;

  // Filter out undefined values and prepare props
  const filteredProps: Record<string, unknown> = {};
  Object.entries(propValues).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      // Convert string numbers to actual numbers for number props
      const propDef = componentDef.props.find((p) => p.name === key);
      if (propDef?.type === 'number' && typeof value === 'string') {
        filteredProps[key] = Number(value);
      } else {
        filteredProps[key] = value;
      }
    }
  });

  // For compound components that need special handling
  const renderCompoundExample = () => {
    if (componentDef.name === 'Card') {
      return (
        <Component {...filteredProps}>
          {filteredProps.children || (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Card Title
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Card description or content goes here.
              </p>
            </div>
          )}
        </Component>
      );
    }

    if (componentDef.name === 'Select') {
      return (
        <Component
          {...filteredProps}
          options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
            { value: 'option3', label: 'Option 3' },
          ]}
        />
      );
    }

    // Default rendering
    return <Component {...filteredProps} />;
  };

  // Generate style overrides CSS with active theme for token resolution
  const overrideCSS = generateStyleOverrideCSS(styleOverrides, activeTheme);
  const hasOverrides = Object.keys(styleOverrides).some(
    (k) => styleOverrides[k as keyof ComponentStyleOverrides] !== undefined
  );

  return (
    <div className="flex-1 min-h-[200px] flex items-center justify-center p-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
      {/* Inject style overrides */}
      {hasOverrides && <style>{overrideCSS}</style>}

      <div className="w-full max-w-md guardrail-preview-container">
        {renderCompoundExample()}
      </div>
    </div>
  );
}
