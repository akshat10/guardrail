import type React from 'react';
import {
  // Primitives
  Box,
  Flex,
  Grid,
  Text,
  Spacer,
  // Elements
  Button,
  Input,
  Textarea,
  Checkbox,
  Switch,
  Select,
  Badge,
  Avatar,
  Link,
  Divider,
  // Components
  Card,
  Modal,
  Tabs,
  Alert,
  Tooltip,
} from '@guardrail/ui';

export type PropType = 'string' | 'number' | 'boolean' | 'select' | 'node';

export interface PropDefinition {
  name: string;
  type: PropType;
  options?: string[];
  defaultValue?: unknown;
  required: boolean;
  description: string;
}

export interface VariantDefinition {
  name: string;
  description: string;
  props: Record<string, unknown>;
}

export type ComponentLayer = 'primitives' | 'elements' | 'components';

export interface ComponentDefinition {
  name: string;
  layer: ComponentLayer;
  description: string;
  props: PropDefinition[];
  component: React.ComponentType<any>;
  variants: VariantDefinition[];
  isCompound?: boolean;
  compoundComponents?: string[];
}

const SPACING_OPTIONS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];

export const componentRegistry: Record<string, ComponentDefinition> = {
  // ============================================
  // PRIMITIVES
  // ============================================
  Box: {
    name: 'Box',
    layer: 'primitives',
    description: 'A flexible container component for layout composition with padding, margin, background, border, and shadow options.',
    component: Box,
    props: [
      { name: 'children', type: 'node', required: false, defaultValue: 'Content', description: 'Content inside the box' },
      { name: 'padding', type: 'select', options: SPACING_OPTIONS, required: false, description: 'Padding on all sides' },
      { name: 'paddingX', type: 'select', options: SPACING_OPTIONS, required: false, description: 'Horizontal padding' },
      { name: 'paddingY', type: 'select', options: SPACING_OPTIONS, required: false, description: 'Vertical padding' },
      { name: 'margin', type: 'select', options: SPACING_OPTIONS, required: false, description: 'Margin on all sides' },
      { name: 'background', type: 'select', options: ['surface', 'card', 'muted', 'primary', 'transparent'], defaultValue: 'transparent', required: false, description: 'Background color preset' },
      { name: 'border', type: 'boolean', defaultValue: false, required: false, description: 'Show border' },
      { name: 'radius', type: 'select', options: ['none', 'sm', 'md', 'lg', 'xl', 'full'], defaultValue: 'none', required: false, description: 'Border radius' },
      { name: 'shadow', type: 'select', options: ['none', 'sm', 'md', 'lg'], defaultValue: 'none', required: false, description: 'Box shadow' },
      { name: 'width', type: 'select', options: ['auto', 'full'], defaultValue: 'auto', required: false, description: 'Width behavior' },
      { name: 'height', type: 'select', options: ['auto', 'full', 'screen'], defaultValue: 'auto', required: false, description: 'Height behavior' },
    ],
    variants: [
      { name: 'Card Style', description: 'Card-like box with border and shadow', props: { children: 'Card content', background: 'card', border: true, radius: 'lg', padding: 'md', shadow: 'sm' } },
      { name: 'Muted Background', description: 'Subtle background', props: { children: 'Muted box', background: 'muted', padding: 'md', radius: 'md' } },
      { name: 'Primary Accent', description: 'Primary colored box', props: { children: 'Primary', background: 'primary', padding: 'sm', radius: 'md' } },
    ],
  },

  Flex: {
    name: 'Flex',
    layer: 'primitives',
    description: 'A flexbox container for creating flexible layouts with direction, alignment, and gap controls.',
    component: Flex,
    props: [
      { name: 'children', type: 'node', required: false, defaultValue: 'Flex content', description: 'Content inside flex container' },
      { name: 'direction', type: 'select', options: ['row', 'column', 'row-reverse', 'column-reverse'], defaultValue: 'row', required: false, description: 'Flex direction' },
      { name: 'align', type: 'select', options: ['start', 'center', 'end', 'stretch', 'baseline'], defaultValue: 'stretch', required: false, description: 'Align items' },
      { name: 'justify', type: 'select', options: ['start', 'center', 'end', 'between', 'around', 'evenly'], defaultValue: 'start', required: false, description: 'Justify content' },
      { name: 'gap', type: 'select', options: SPACING_OPTIONS, defaultValue: 'none', required: false, description: 'Gap between items' },
      { name: 'wrap', type: 'boolean', defaultValue: false, required: false, description: 'Allow wrapping' },
      { name: 'padding', type: 'select', options: SPACING_OPTIONS, required: false, description: 'Padding' },
      { name: 'width', type: 'select', options: ['auto', 'full'], defaultValue: 'auto', required: false, description: 'Width' },
      { name: 'height', type: 'select', options: ['auto', 'full'], defaultValue: 'auto', required: false, description: 'Height' },
    ],
    variants: [
      { name: 'Row Centered', description: 'Horizontally centered row', props: { direction: 'row', align: 'center', justify: 'center', gap: 'md', children: 'Centered items' } },
      { name: 'Column Stack', description: 'Vertical stack', props: { direction: 'column', gap: 'sm', children: 'Stacked items' } },
      { name: 'Space Between', description: 'Items spread apart', props: { direction: 'row', justify: 'between', align: 'center', width: 'full', children: 'Spread items' } },
    ],
  },

  Grid: {
    name: 'Grid',
    layer: 'primitives',
    description: 'A CSS grid container for creating grid-based layouts with configurable columns and gaps.',
    component: Grid,
    props: [
      { name: 'children', type: 'node', required: false, defaultValue: 'Grid content', description: 'Content inside grid' },
      { name: 'columns', type: 'select', options: ['1', '2', '3', '4', '5', '6', '12'], defaultValue: '1', required: false, description: 'Number of columns' },
      { name: 'gap', type: 'select', options: SPACING_OPTIONS, defaultValue: 'md', required: false, description: 'Gap between items' },
      { name: 'rowGap', type: 'select', options: SPACING_OPTIONS, required: false, description: 'Row gap' },
      { name: 'columnGap', type: 'select', options: SPACING_OPTIONS, required: false, description: 'Column gap' },
      { name: 'padding', type: 'select', options: SPACING_OPTIONS, required: false, description: 'Padding' },
      { name: 'width', type: 'select', options: ['auto', 'full'], defaultValue: 'auto', required: false, description: 'Width' },
    ],
    variants: [
      { name: '2 Columns', description: 'Two column layout', props: { columns: 2, gap: 'md', children: 'Grid items' } },
      { name: '3 Columns', description: 'Three column layout', props: { columns: 3, gap: 'lg', children: 'Grid items' } },
      { name: '4 Columns', description: 'Four column layout', props: { columns: 4, gap: 'sm', children: 'Grid items' } },
    ],
  },

  Text: {
    name: 'Text',
    layer: 'primitives',
    description: 'A typography component for rendering text with configurable size, weight, color, and alignment.',
    component: Text,
    props: [
      { name: 'children', type: 'node', required: false, defaultValue: 'Hello World', description: 'Text content' },
      { name: 'size', type: 'select', options: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'], defaultValue: 'base', required: false, description: 'Font size' },
      { name: 'weight', type: 'select', options: ['normal', 'medium', 'semibold', 'bold'], defaultValue: 'normal', required: false, description: 'Font weight' },
      { name: 'color', type: 'select', options: ['default', 'muted', 'primary', 'success', 'warning', 'error'], defaultValue: 'default', required: false, description: 'Text color' },
      { name: 'align', type: 'select', options: ['left', 'center', 'right'], defaultValue: 'left', required: false, description: 'Text alignment' },
      { name: 'as', type: 'select', options: ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label'], defaultValue: 'p', required: false, description: 'HTML element' },
      { name: 'truncate', type: 'boolean', defaultValue: false, required: false, description: 'Truncate with ellipsis' },
    ],
    variants: [
      { name: 'Heading', description: 'Large bold heading', props: { children: 'Welcome', size: '2xl', weight: 'bold', as: 'h1' } },
      { name: 'Muted', description: 'Subdued text', props: { children: 'Secondary info', color: 'muted', size: 'sm' } },
      { name: 'Error', description: 'Error message', props: { children: 'Something went wrong', color: 'error', size: 'sm' } },
      { name: 'Success', description: 'Success message', props: { children: 'Operation complete!', color: 'success' } },
    ],
  },

  Spacer: {
    name: 'Spacer',
    layer: 'primitives',
    description: 'An invisible element that creates consistent spacing between elements.',
    component: Spacer,
    props: [
      { name: 'size', type: 'select', options: SPACING_OPTIONS, defaultValue: 'md', required: false, description: 'Spacing size' },
      { name: 'axis', type: 'select', options: ['horizontal', 'vertical'], defaultValue: 'vertical', required: false, description: 'Direction of spacing' },
    ],
    variants: [
      { name: 'Small Vertical', description: 'Small vertical space', props: { size: 'sm', axis: 'vertical' } },
      { name: 'Large Vertical', description: 'Large vertical space', props: { size: 'lg', axis: 'vertical' } },
      { name: 'Horizontal', description: 'Horizontal space', props: { size: 'md', axis: 'horizontal' } },
    ],
  },

  // ============================================
  // ELEMENTS
  // ============================================
  Button: {
    name: 'Button',
    layer: 'elements',
    description: 'A clickable button element with multiple visual variants and sizes for triggering actions.',
    component: Button,
    props: [
      { name: 'children', type: 'node', defaultValue: 'Click me', required: false, description: 'Button label' },
      { name: 'variant', type: 'select', options: ['primary', 'secondary', 'ghost', 'destructive'], defaultValue: 'primary', required: false, description: 'Visual style' },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'], defaultValue: 'md', required: false, description: 'Button size' },
      { name: 'disabled', type: 'boolean', defaultValue: false, required: false, description: 'Disable button' },
      { name: 'fullWidth', type: 'boolean', defaultValue: false, required: false, description: 'Full width button' },
      { name: 'type', type: 'select', options: ['button', 'submit', 'reset'], defaultValue: 'button', required: false, description: 'HTML button type' },
    ],
    variants: [
      { name: 'Primary', description: 'Main call to action', props: { variant: 'primary', children: 'Primary' } },
      { name: 'Secondary', description: 'Secondary action', props: { variant: 'secondary', children: 'Secondary' } },
      { name: 'Ghost', description: 'Subtle/tertiary action', props: { variant: 'ghost', children: 'Ghost' } },
      { name: 'Destructive', description: 'Dangerous action', props: { variant: 'destructive', children: 'Delete' } },
      { name: 'Small', description: 'Compact size', props: { size: 'sm', children: 'Small' } },
      { name: 'Large', description: 'Prominent size', props: { size: 'lg', children: 'Large' } },
      { name: 'Disabled', description: 'Non-interactive', props: { disabled: true, children: 'Disabled' } },
      { name: 'Full Width', description: 'Fills container', props: { fullWidth: true, children: 'Full Width' } },
    ],
  },

  Input: {
    name: 'Input',
    layer: 'elements',
    description: 'A text input field with label, helper text, and error state support.',
    component: Input,
    props: [
      { name: 'label', type: 'string', defaultValue: 'Label', required: false, description: 'Input label' },
      { name: 'placeholder', type: 'string', defaultValue: 'Enter text...', required: false, description: 'Placeholder text' },
      { name: 'type', type: 'select', options: ['text', 'email', 'password', 'number', 'tel', 'url'], defaultValue: 'text', required: false, description: 'Input type' },
      { name: 'value', type: 'string', required: false, description: 'Input value' },
      { name: 'disabled', type: 'boolean', defaultValue: false, required: false, description: 'Disable input' },
      { name: 'error', type: 'string', required: false, description: 'Error message' },
      { name: 'helperText', type: 'string', required: false, description: 'Helper text' },
      { name: 'required', type: 'boolean', defaultValue: false, required: false, description: 'Mark as required' },
    ],
    variants: [
      { name: 'Default', description: 'Standard input', props: { label: 'Email', placeholder: 'you@example.com' } },
      { name: 'With Helper', description: 'Input with helper text', props: { label: 'Username', placeholder: 'johndoe', helperText: 'Must be unique' } },
      { name: 'With Error', description: 'Error state', props: { label: 'Email', value: 'invalid', error: 'Invalid email address' } },
      { name: 'Password', description: 'Password input', props: { label: 'Password', type: 'password', placeholder: 'Enter password' } },
      { name: 'Required', description: 'Required field', props: { label: 'Name', required: true, placeholder: 'Enter name' } },
      { name: 'Disabled', description: 'Disabled input', props: { label: 'Disabled', disabled: true, value: 'Cannot edit' } },
    ],
  },

  Textarea: {
    name: 'Textarea',
    layer: 'elements',
    description: 'A multi-line text input for longer content with label and error support.',
    component: Textarea,
    props: [
      { name: 'label', type: 'string', defaultValue: 'Description', required: false, description: 'Textarea label' },
      { name: 'placeholder', type: 'string', defaultValue: 'Enter description...', required: false, description: 'Placeholder text' },
      { name: 'value', type: 'string', required: false, description: 'Textarea value' },
      { name: 'rows', type: 'number', defaultValue: 4, required: false, description: 'Number of rows' },
      { name: 'disabled', type: 'boolean', defaultValue: false, required: false, description: 'Disable textarea' },
      { name: 'error', type: 'string', required: false, description: 'Error message' },
      { name: 'helperText', type: 'string', required: false, description: 'Helper text' },
      { name: 'required', type: 'boolean', defaultValue: false, required: false, description: 'Mark as required' },
    ],
    variants: [
      { name: 'Default', description: 'Standard textarea', props: { label: 'Bio', placeholder: 'Tell us about yourself...' } },
      { name: 'With Helper', description: 'With helper text', props: { label: 'Notes', helperText: 'Max 500 characters' } },
      { name: 'With Error', description: 'Error state', props: { label: 'Message', error: 'Message is required' } },
      { name: 'More Rows', description: 'Taller textarea', props: { label: 'Content', rows: 8 } },
    ],
  },

  Checkbox: {
    name: 'Checkbox',
    layer: 'elements',
    description: 'A checkbox input with label and optional description for boolean choices.',
    component: Checkbox,
    props: [
      { name: 'label', type: 'string', defaultValue: 'Accept terms', required: true, description: 'Checkbox label' },
      { name: 'checked', type: 'boolean', defaultValue: false, required: false, description: 'Checked state' },
      { name: 'disabled', type: 'boolean', defaultValue: false, required: false, description: 'Disable checkbox' },
      { name: 'description', type: 'string', required: false, description: 'Additional description' },
    ],
    variants: [
      { name: 'Unchecked', description: 'Default unchecked', props: { label: 'Subscribe to newsletter' } },
      { name: 'Checked', description: 'Checked state', props: { label: 'Accept terms', checked: true } },
      { name: 'With Description', description: 'With description', props: { label: 'Marketing emails', description: 'Receive promotional offers and updates' } },
      { name: 'Disabled', description: 'Disabled state', props: { label: 'Disabled option', disabled: true } },
    ],
  },

  Switch: {
    name: 'Switch',
    layer: 'elements',
    description: 'A toggle switch for on/off states with label and description support.',
    component: Switch,
    props: [
      { name: 'label', type: 'string', defaultValue: 'Dark mode', required: true, description: 'Switch label' },
      { name: 'checked', type: 'boolean', defaultValue: false, required: false, description: 'On/off state' },
      { name: 'disabled', type: 'boolean', defaultValue: false, required: false, description: 'Disable switch' },
      { name: 'description', type: 'string', required: false, description: 'Additional description' },
    ],
    variants: [
      { name: 'Off', description: 'Switch off', props: { label: 'Notifications', checked: false } },
      { name: 'On', description: 'Switch on', props: { label: 'Dark mode', checked: true } },
      { name: 'With Description', description: 'With description', props: { label: 'Auto-save', description: 'Automatically save changes', checked: true } },
      { name: 'Disabled', description: 'Disabled switch', props: { label: 'Disabled', disabled: true } },
    ],
  },

  Select: {
    name: 'Select',
    layer: 'elements',
    description: 'A dropdown select menu for choosing from a list of options.',
    component: Select,
    props: [
      { name: 'label', type: 'string', defaultValue: 'Country', required: false, description: 'Select label' },
      { name: 'placeholder', type: 'string', defaultValue: 'Select an option', required: false, description: 'Placeholder text' },
      { name: 'value', type: 'string', required: false, description: 'Selected value' },
      { name: 'disabled', type: 'boolean', defaultValue: false, required: false, description: 'Disable select' },
      { name: 'error', type: 'string', required: false, description: 'Error message' },
      { name: 'required', type: 'boolean', defaultValue: false, required: false, description: 'Mark as required' },
    ],
    variants: [
      { name: 'Default', description: 'Standard select', props: { label: 'Country' } },
      { name: 'With Error', description: 'Error state', props: { label: 'Size', error: 'Please select a size' } },
      { name: 'Required', description: 'Required field', props: { label: 'Category', required: true } },
      { name: 'Disabled', description: 'Disabled select', props: { label: 'Status', disabled: true } },
    ],
  },

  Badge: {
    name: 'Badge',
    layer: 'elements',
    description: 'An inline badge for displaying status, labels, or counts.',
    component: Badge,
    props: [
      { name: 'children', type: 'node', defaultValue: 'Badge', required: true, description: 'Badge content' },
      { name: 'variant', type: 'select', options: ['default', 'success', 'warning', 'error', 'info'], defaultValue: 'default', required: false, description: 'Visual variant' },
      { name: 'size', type: 'select', options: ['sm', 'md'], defaultValue: 'md', required: false, description: 'Badge size' },
    ],
    variants: [
      { name: 'Default', description: 'Neutral badge', props: { children: 'Default', variant: 'default' } },
      { name: 'Success', description: 'Success state', props: { children: 'Active', variant: 'success' } },
      { name: 'Warning', description: 'Warning state', props: { children: 'Pending', variant: 'warning' } },
      { name: 'Error', description: 'Error state', props: { children: 'Failed', variant: 'error' } },
      { name: 'Info', description: 'Info state', props: { children: 'New', variant: 'info' } },
      { name: 'Small', description: 'Small size', props: { children: '99+', size: 'sm' } },
    ],
  },

  Avatar: {
    name: 'Avatar',
    layer: 'elements',
    description: 'A user avatar with image support and fallback initials.',
    component: Avatar,
    props: [
      { name: 'fallback', type: 'string', defaultValue: 'John Doe', required: true, description: 'Fallback name for initials' },
      { name: 'src', type: 'string', required: false, description: 'Image URL' },
      { name: 'alt', type: 'string', required: false, description: 'Alt text' },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg', 'xl'], defaultValue: 'md', required: false, description: 'Avatar size' },
    ],
    variants: [
      { name: 'Initials', description: 'Fallback initials', props: { fallback: 'John Doe' } },
      { name: 'Small', description: 'Small avatar', props: { fallback: 'Jane Smith', size: 'sm' } },
      { name: 'Large', description: 'Large avatar', props: { fallback: 'Bob Wilson', size: 'lg' } },
      { name: 'Extra Large', description: 'XL avatar', props: { fallback: 'Alice Brown', size: 'xl' } },
    ],
  },

  Link: {
    name: 'Link',
    layer: 'elements',
    description: 'A styled anchor link with variants for different contexts.',
    component: Link,
    props: [
      { name: 'children', type: 'node', defaultValue: 'Click here', required: true, description: 'Link text' },
      { name: 'href', type: 'string', defaultValue: '#', required: true, description: 'Link URL' },
      { name: 'external', type: 'boolean', defaultValue: false, required: false, description: 'Open in new tab' },
      { name: 'variant', type: 'select', options: ['default', 'muted'], defaultValue: 'default', required: false, description: 'Visual variant' },
    ],
    variants: [
      { name: 'Default', description: 'Primary link', props: { children: 'Learn more', href: '#' } },
      { name: 'Muted', description: 'Subtle link', props: { children: 'Privacy policy', href: '#', variant: 'muted' } },
      { name: 'External', description: 'External link', props: { children: 'Visit website', href: '#', external: true } },
    ],
  },

  Divider: {
    name: 'Divider',
    layer: 'elements',
    description: 'A visual separator line for dividing content sections.',
    component: Divider,
    props: [
      { name: 'orientation', type: 'select', options: ['horizontal', 'vertical'], defaultValue: 'horizontal', required: false, description: 'Line direction' },
      { name: 'spacing', type: 'select', options: ['sm', 'md', 'lg'], defaultValue: 'md', required: false, description: 'Space around divider' },
    ],
    variants: [
      { name: 'Horizontal', description: 'Horizontal line', props: { orientation: 'horizontal' } },
      { name: 'Vertical', description: 'Vertical line', props: { orientation: 'vertical' } },
      { name: 'Small Spacing', description: 'Tight spacing', props: { spacing: 'sm' } },
      { name: 'Large Spacing', description: 'Wide spacing', props: { spacing: 'lg' } },
    ],
  },

  // ============================================
  // COMPONENTS (Compound)
  // ============================================
  Card: {
    name: 'Card',
    layer: 'components',
    description: 'A container card with optional header, content, and footer sections.',
    component: Card,
    isCompound: true,
    compoundComponents: ['CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
    props: [
      { name: 'children', type: 'node', defaultValue: 'Card content', required: true, description: 'Card content' },
      { name: 'padding', type: 'select', options: ['none', 'sm', 'md', 'lg'], defaultValue: 'none', required: false, description: 'Internal padding' },
    ],
    variants: [
      { name: 'Simple', description: 'Basic card', props: { children: 'Simple card content', padding: 'md' } },
      { name: 'No Padding', description: 'Card without padding', props: { children: 'Content with sections' } },
    ],
  },

  Alert: {
    name: 'Alert',
    layer: 'components',
    description: 'An alert banner for displaying important messages with semantic variants.',
    component: Alert,
    props: [
      { name: 'children', type: 'node', defaultValue: 'Alert message', required: true, description: 'Alert content' },
      { name: 'title', type: 'string', required: false, description: 'Alert title' },
      { name: 'variant', type: 'select', options: ['default', 'success', 'warning', 'error', 'info'], defaultValue: 'default', required: false, description: 'Alert type' },
    ],
    variants: [
      { name: 'Default', description: 'Neutral alert', props: { title: 'Note', children: 'This is a default alert message.' } },
      { name: 'Success', description: 'Success message', props: { title: 'Success!', children: 'Your changes have been saved.', variant: 'success' } },
      { name: 'Warning', description: 'Warning message', props: { title: 'Warning', children: 'This action cannot be undone.', variant: 'warning' } },
      { name: 'Error', description: 'Error message', props: { title: 'Error', children: 'Failed to save changes.', variant: 'error' } },
      { name: 'Info', description: 'Informational', props: { title: 'Info', children: 'New features are available.', variant: 'info' } },
      { name: 'No Title', description: 'Without title', props: { children: 'Simple alert without a title.', variant: 'info' } },
    ],
  },

  Tabs: {
    name: 'Tabs',
    layer: 'components',
    description: 'A tabbed interface for organizing content into switchable panels.',
    component: Tabs,
    isCompound: true,
    compoundComponents: ['TabsList', 'TabsTrigger', 'TabsContent'],
    props: [
      { name: 'children', type: 'node', required: true, description: 'Tab components' },
      { name: 'defaultValue', type: 'string', defaultValue: 'tab1', required: true, description: 'Initial active tab' },
    ],
    variants: [
      { name: 'Default', description: 'Basic tabs', props: { defaultValue: 'tab1', children: 'Tab content' } },
    ],
  },

  Modal: {
    name: 'Modal',
    layer: 'components',
    description: 'A dialog/modal overlay for focused interactions.',
    component: Modal,
    isCompound: true,
    compoundComponents: ['ModalTrigger', 'ModalContent', 'ModalFooter'],
    props: [
      { name: 'children', type: 'node', required: true, description: 'Modal components' },
      { name: 'open', type: 'boolean', defaultValue: false, required: false, description: 'Controlled open state' },
    ],
    variants: [
      { name: 'Default', description: 'Basic modal', props: { children: 'Modal content' } },
    ],
  },

  Tooltip: {
    name: 'Tooltip',
    layer: 'components',
    description: 'A hover tooltip for displaying additional information.',
    component: Tooltip,
    isCompound: true,
    compoundComponents: ['TooltipTrigger', 'TooltipContent'],
    props: [
      { name: 'children', type: 'node', required: true, description: 'Tooltip components' },
    ],
    variants: [
      { name: 'Default', description: 'Basic tooltip', props: { children: 'Tooltip content' } },
    ],
  },
};

// Get components by layer
export function getComponentsByLayer(layer: ComponentLayer): ComponentDefinition[] {
  return Object.values(componentRegistry).filter((c) => c.layer === layer);
}

// Get all component names
export function getAllComponentNames(): string[] {
  return Object.keys(componentRegistry);
}

// Get component by name
export function getComponent(name: string): ComponentDefinition | undefined {
  return componentRegistry[name];
}

// Get default props for a component
export function getDefaultProps(name: string): Record<string, unknown> {
  const component = componentRegistry[name];
  if (!component) return {};

  const defaults: Record<string, unknown> = {};
  component.props.forEach((prop) => {
    if (prop.defaultValue !== undefined) {
      defaults[prop.name] = prop.defaultValue;
    }
  });
  return defaults;
}
