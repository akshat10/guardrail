/**
 * Prop Constraints Registry
 *
 * Defines all valid token values for each component prop.
 * Used by the validator to detect arbitrary values like padding="17px"
 * and by the prop editor to show valid options.
 */

// Token type definitions
export type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type SizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ShadowToken = 'none' | 'sm' | 'md' | 'lg';

// Reusable token arrays
const SPACING_VALUES = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
const RADIUS_VALUES = ['none', 'sm', 'md', 'lg', 'xl', 'full'];
const SHADOW_VALUES = ['none', 'sm', 'md', 'lg'];

/**
 * Component prop constraints
 * Maps component name -> prop name -> allowed values
 */
export const PROP_CONSTRAINTS: Record<string, Record<string, string[]>> = {
  // ============ PRIMITIVES ============

  Box: {
    padding: SPACING_VALUES,
    paddingX: SPACING_VALUES,
    paddingY: SPACING_VALUES,
    paddingTop: SPACING_VALUES,
    paddingBottom: SPACING_VALUES,
    paddingLeft: SPACING_VALUES,
    paddingRight: SPACING_VALUES,
    margin: SPACING_VALUES,
    marginX: SPACING_VALUES,
    marginY: SPACING_VALUES,
    marginTop: SPACING_VALUES,
    marginBottom: SPACING_VALUES,
    marginLeft: SPACING_VALUES,
    marginRight: SPACING_VALUES,
    background: ['transparent', 'surface', 'card', 'muted', 'accent', 'primary'],
    border: ['none', 'default', 'accent', 'muted'],
    radius: RADIUS_VALUES,
    shadow: SHADOW_VALUES,
    width: ['auto', 'full'],
    height: ['auto', 'full', 'screen'],
  },

  Flex: {
    direction: ['row', 'column', 'row-reverse', 'column-reverse'],
    align: ['start', 'center', 'end', 'stretch', 'baseline'],
    justify: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    gap: SPACING_VALUES,
    wrap: ['nowrap', 'wrap', 'wrap-reverse'],
    // Inherits Box props
    padding: SPACING_VALUES,
    paddingX: SPACING_VALUES,
    paddingY: SPACING_VALUES,
    background: ['transparent', 'surface', 'card', 'muted', 'accent', 'primary'],
    border: ['none', 'default', 'accent', 'muted'],
    radius: RADIUS_VALUES,
  },

  Grid: {
    columns: ['1', '2', '3', '4', '6', '12'],
    gap: SPACING_VALUES,
    rowGap: SPACING_VALUES,
    columnGap: SPACING_VALUES,
    // Inherits Box props
    padding: SPACING_VALUES,
    paddingX: SPACING_VALUES,
    paddingY: SPACING_VALUES,
  },

  Text: {
    size: ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl'],
    weight: ['normal', 'medium', 'semibold', 'bold'],
    color: ['default', 'muted', 'accent', 'primary', 'success', 'warning', 'error'],
    align: ['left', 'center', 'right'],
    leading: ['tight', 'normal', 'relaxed'],
    truncate: ['true', 'false'],
  },

  Spacer: {
    size: SPACING_VALUES,
  },

  // ============ ELEMENTS ============

  Button: {
    variant: ['primary', 'secondary', 'ghost', 'destructive', 'outline'],
    size: ['sm', 'md', 'lg'],
    disabled: ['true', 'false'],
    fullWidth: ['true', 'false'],
  },

  Input: {
    type: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    size: ['sm', 'md', 'lg'],
    disabled: ['true', 'false'],
    required: ['true', 'false'],
    // label, placeholder, value, error are free-form strings
  },

  Textarea: {
    rows: ['3', '4', '5', '6', '8', '10'],
    size: ['sm', 'md', 'lg'],
    disabled: ['true', 'false'],
    required: ['true', 'false'],
    resize: ['none', 'vertical', 'horizontal', 'both'],
  },

  Checkbox: {
    size: ['sm', 'md', 'lg'],
    disabled: ['true', 'false'],
    checked: ['true', 'false'],
  },

  Switch: {
    size: ['sm', 'md', 'lg'],
    disabled: ['true', 'false'],
    checked: ['true', 'false'],
  },

  Select: {
    size: ['sm', 'md', 'lg'],
    disabled: ['true', 'false'],
    required: ['true', 'false'],
    // label, placeholder, options are handled separately
  },

  Badge: {
    variant: ['default', 'success', 'warning', 'error', 'info', 'outline'],
    size: ['sm', 'md', 'lg'],
  },

  Avatar: {
    size: ['xs', 'sm', 'md', 'lg', 'xl'],
    radius: ['sm', 'md', 'lg', 'full'],
    // src, fallback are free-form strings
  },

  Link: {
    variant: ['default', 'muted', 'accent'],
    underline: ['always', 'hover', 'none'],
    // href is free-form string
  },

  Divider: {
    orientation: ['horizontal', 'vertical'],
    variant: ['default', 'muted'],
  },

  // ============ COMPONENTS ============

  Card: {
    variant: ['default', 'bordered', 'elevated'],
    padding: SPACING_VALUES,
    radius: RADIUS_VALUES,
  },

  CardHeader: {
    padding: SPACING_VALUES,
  },

  CardTitle: {
    size: ['sm', 'md', 'lg', 'xl'],
  },

  CardDescription: {
    // No constrained props - just children
  },

  CardContent: {
    padding: SPACING_VALUES,
  },

  CardFooter: {
    padding: SPACING_VALUES,
    align: ['start', 'center', 'end', 'between'],
  },

  Modal: {
    // Modal is a context provider, no visual props
  },

  ModalTrigger: {
    asChild: ['true', 'false'],
  },

  ModalContent: {
    size: ['sm', 'md', 'lg', 'xl', 'full'],
    // title is free-form string
  },

  ModalFooter: {
    align: ['start', 'center', 'end', 'between'],
  },

  Tabs: {
    variant: ['default', 'pills', 'underline'],
    // defaultValue is free-form string
  },

  TabsList: {
    // No constrained props
  },

  TabsTrigger: {
    disabled: ['true', 'false'],
    // value is free-form string
  },

  TabsContent: {
    // value is free-form string
  },

  Alert: {
    variant: ['default', 'success', 'warning', 'error', 'info'],
  },

  Tooltip: {
    // Tooltip is a context provider
  },

  TooltipTrigger: {
    asChild: ['true', 'false'],
  },

  TooltipContent: {
    side: ['top', 'right', 'bottom', 'left'],
    align: ['start', 'center', 'end'],
  },
};

/**
 * Props that accept free-form string values (not validated)
 */
export const FREE_FORM_PROPS = new Set([
  'label',
  'placeholder',
  'value',
  'defaultValue',
  'error',
  'src',
  'fallback',
  'href',
  'title',
  'description',
  'children',
  'id',
  'name',
  'aria-label',
  'aria-describedby',
  'data-testid',
]);

/**
 * Props that accept function values (not validated as strings)
 */
export const FUNCTION_PROPS = new Set([
  'onClick',
  'onChange',
  'onBlur',
  'onFocus',
  'onSubmit',
  'onKeyDown',
  'onKeyUp',
  'onMouseEnter',
  'onMouseLeave',
]);

/**
 * Get allowed values for a component prop
 * @returns Array of allowed values, or null if prop accepts any value
 */
export function getAllowedValues(component: string, prop: string): string[] | null {
  // Skip validation for free-form and function props
  if (FREE_FORM_PROPS.has(prop) || FUNCTION_PROPS.has(prop)) {
    return null;
  }

  const componentConstraints = PROP_CONSTRAINTS[component];
  if (!componentConstraints) {
    return null; // Unknown component, can't validate
  }

  return componentConstraints[prop] || null;
}

/**
 * Check if a value is valid for a component prop
 * @returns true if valid, false if invalid, null if can't determine
 */
export function isValidPropValue(
  component: string,
  prop: string,
  value: string
): boolean | null {
  const allowed = getAllowedValues(component, prop);

  if (allowed === null) {
    return null; // Can't validate - prop accepts any value
  }

  return allowed.includes(value);
}

/**
 * Get all components that have prop constraints
 */
export function getConstrainedComponents(): string[] {
  return Object.keys(PROP_CONSTRAINTS);
}

/**
 * Get all constrained props for a component
 */
export function getConstrainedProps(component: string): string[] {
  const constraints = PROP_CONSTRAINTS[component];
  return constraints ? Object.keys(constraints) : [];
}
