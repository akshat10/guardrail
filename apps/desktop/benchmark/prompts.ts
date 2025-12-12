/**
 * Benchmark prompts for testing Guardrail code generation
 *
 * These prompts are used to test the quality and validity of generated code.
 * Each prompt should result in valid code that passes the AST validator.
 */

export interface BenchmarkPrompt {
  id: string;
  prompt: string;
  description: string;
  expectedComponents: string[];
  complexity: 'simple' | 'medium' | 'complex';
}

export const BENCHMARK_PROMPTS: BenchmarkPrompt[] = [
  // Simple (1-3 components)
  {
    id: 'simple-card',
    prompt: 'Create a card with a title and description',
    description: 'Basic card with text content',
    expectedComponents: ['Card', 'CardHeader', 'CardTitle', 'CardDescription'],
    complexity: 'simple',
  },
  {
    id: 'simple-button-group',
    prompt: 'Create a row of three buttons: Cancel, Save Draft, and Submit',
    description: 'Horizontal button group with different variants',
    expectedComponents: ['Flex', 'Button'],
    complexity: 'simple',
  },
  {
    id: 'simple-text-display',
    prompt: 'Create a heading with a subtitle below it, centered on the page',
    description: 'Basic text hierarchy',
    expectedComponents: ['Flex', 'Text'],
    complexity: 'simple',
  },
  {
    id: 'simple-avatar-badge',
    prompt: 'Create a user avatar with their name and an "Admin" badge next to it',
    description: 'Avatar with metadata',
    expectedComponents: ['Flex', 'Avatar', 'Text', 'Badge'],
    complexity: 'simple',
  },
  {
    id: 'simple-alert',
    prompt: 'Create an error alert with a message about a failed login attempt',
    description: 'Error state display',
    expectedComponents: ['Alert'],
    complexity: 'simple',
  },

  // Medium (4-6 components)
  {
    id: 'medium-login-form',
    prompt: 'Create a login form with email input, password input, and a submit button',
    description: 'Basic authentication form',
    expectedComponents: ['Card', 'Input', 'Button', 'Flex'],
    complexity: 'medium',
  },
  {
    id: 'medium-settings-form',
    prompt: 'Create a settings form with name input, email input, and save button',
    description: 'Basic settings form',
    expectedComponents: ['Card', 'CardContent', 'Input', 'Button', 'Flex'],
    complexity: 'medium',
  },
  {
    id: 'medium-notification-toggles',
    prompt: 'Create a notification settings panel with email and SMS toggle switches',
    description: 'Toggle switches for settings',
    expectedComponents: ['Card', 'Switch', 'Flex', 'Text', 'Divider'],
    complexity: 'medium',
  },
  {
    id: 'medium-profile-card',
    prompt: 'Create a profile card with avatar, name, email, and an edit button',
    description: 'User profile display',
    expectedComponents: ['Card', 'Avatar', 'Text', 'Button', 'Flex'],
    complexity: 'medium',
  },
  {
    id: 'medium-status-badges',
    prompt: 'Create a list of three items showing task names with status badges (completed, in progress, pending)',
    description: 'List with status indicators',
    expectedComponents: ['Flex', 'Text', 'Badge', 'Divider'],
    complexity: 'medium',
  },
  {
    id: 'medium-contact-form',
    prompt: 'Create a contact form with name, email, message textarea, and submit button',
    description: 'Contact form with multiple input types',
    expectedComponents: ['Card', 'Input', 'Textarea', 'Button', 'Flex'],
    complexity: 'medium',
  },
  {
    id: 'medium-modal-confirm',
    prompt: 'Create a delete confirmation modal with a warning message and Cancel/Delete buttons',
    description: 'Confirmation dialog',
    expectedComponents: ['Modal', 'ModalTrigger', 'ModalContent', 'Button', 'Text'],
    complexity: 'medium',
  },

  // Complex (7+ components)
  {
    id: 'complex-settings-page',
    prompt: 'Create a settings page with profile section (avatar, name, email inputs), notification toggles (email, push, SMS), and save/cancel buttons',
    description: 'Full settings page',
    expectedComponents: ['Card', 'Avatar', 'Input', 'Switch', 'Button', 'Flex', 'Text', 'Divider'],
    complexity: 'complex',
  },
  {
    id: 'complex-dashboard-card',
    prompt: 'Create a dashboard card with a title, description, stats grid showing 4 metrics with labels and values, and a "View Details" link',
    description: 'Analytics dashboard card',
    expectedComponents: ['Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'Grid', 'Text', 'Link'],
    complexity: 'complex',
  },
  {
    id: 'complex-tabbed-form',
    prompt: 'Create a tabbed interface with "Profile" and "Security" tabs. Profile tab has name/email inputs, Security tab has password change inputs',
    description: 'Multi-tab form',
    expectedComponents: ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent', 'Input', 'Button', 'Flex'],
    complexity: 'complex',
  },
  {
    id: 'complex-user-list',
    prompt: 'Create a user list showing 3 users with avatar, name, email, role badge, and action buttons (Edit, Delete) for each',
    description: 'User management list',
    expectedComponents: ['Card', 'Flex', 'Avatar', 'Text', 'Badge', 'Button', 'Divider'],
    complexity: 'complex',
  },
  {
    id: 'complex-checkout-form',
    prompt: 'Create a checkout form with shipping address inputs (name, address, city, zip), payment method select, and Place Order button',
    description: 'E-commerce checkout',
    expectedComponents: ['Card', 'Input', 'Select', 'Button', 'Flex', 'Text', 'Grid'],
    complexity: 'complex',
  },
  {
    id: 'complex-feature-comparison',
    prompt: 'Create a pricing card with plan name, price, feature list with checkmarks, and a Subscribe button',
    description: 'Pricing/feature card',
    expectedComponents: ['Card', 'CardHeader', 'CardTitle', 'CardContent', 'CardFooter', 'Text', 'Flex', 'Badge', 'Button'],
    complexity: 'complex',
  },
  {
    id: 'complex-feedback-form',
    prompt: 'Create a feedback form with rating select (1-5), category select, comment textarea, checkbox for follow-up, and submit button',
    description: 'Customer feedback form',
    expectedComponents: ['Card', 'Select', 'Textarea', 'Checkbox', 'Button', 'Flex', 'Text'],
    complexity: 'complex',
  },
  {
    id: 'complex-article-preview',
    prompt: 'Create an article preview card with title, author avatar and name, date badge, excerpt text, read more link, and share button with tooltip',
    description: 'Blog article preview',
    expectedComponents: ['Card', 'CardHeader', 'CardContent', 'CardFooter', 'Text', 'Avatar', 'Badge', 'Link', 'Button', 'Tooltip', 'TooltipTrigger', 'TooltipContent'],
    complexity: 'complex',
  },
];

/**
 * Get prompts by complexity level
 */
export function getPromptsByComplexity(complexity: BenchmarkPrompt['complexity']): BenchmarkPrompt[] {
  return BENCHMARK_PROMPTS.filter((p) => p.complexity === complexity);
}

/**
 * Get a random subset of prompts
 */
export function getRandomPrompts(count: number): BenchmarkPrompt[] {
  const shuffled = [...BENCHMARK_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get prompt by ID
 */
export function getPromptById(id: string): BenchmarkPrompt | undefined {
  return BENCHMARK_PROMPTS.find((p) => p.id === id);
}
