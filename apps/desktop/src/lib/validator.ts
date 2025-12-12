import * as parser from '@babel/parser';
import traverse from '@babel/traverse';

const ALLOWED_IMPORTS = ['@guardrail/ui', 'react'];

const ALLOWED_COMPONENTS = new Set([
  // Primitives (Layer 2)
  'Box',
  'Flex',
  'Grid',
  'Text',
  'Spacer',
  // Elements (Layer 3)
  'Button',
  'Input',
  'Textarea',
  'Checkbox',
  'Switch',
  'Select',
  'Badge',
  'Avatar',
  'Link',
  'Divider',
  // Components (Layer 4)
  'Card',
  'CardHeader',
  'CardTitle',
  'CardDescription',
  'CardContent',
  'CardFooter',
  'Modal',
  'ModalTrigger',
  'ModalContent',
  'ModalFooter',
  'Tabs',
  'TabsList',
  'TabsTrigger',
  'TabsContent',
  'Alert',
  'Tooltip',
  'TooltipTrigger',
  'TooltipContent',
  // React built-ins (allowed)
  'Fragment',
]);

const FORBIDDEN_PROPS = new Set(['className', 'style']);

const HTML_ELEMENTS = new Set([
  'div',
  'span',
  'p',
  'a',
  'button',
  'input',
  'form',
  'label',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'img',
  'table',
  'tr',
  'td',
  'th',
  'header',
  'footer',
  'main',
  'section',
  'article',
  'aside',
  'nav',
  'textarea',
  'select',
  'option',
]);

export interface ValidationError {
  type: 'import' | 'element' | 'prop' | 'syntax';
  message: string;
  line: number;
  column: number;
  fix: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validate(code: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Try to parse the code
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (e: unknown) {
    const error = e as { message?: string; loc?: { line?: number; column?: number } };
    return {
      valid: false,
      errors: [
        {
          type: 'syntax',
          message: `Syntax error: ${error.message || 'Unknown error'}`,
          line: error.loc?.line || 1,
          column: error.loc?.column || 0,
          fix: 'Fix the syntax error in the generated code',
        },
      ],
    };
  }

  traverse(ast, {
    // Check imports
    ImportDeclaration(path) {
      const source = path.node.source.value;
      const isAllowed = ALLOWED_IMPORTS.some(
        (allowed) => source === allowed || source.startsWith(allowed + '/')
      );

      if (!isAllowed) {
        errors.push({
          type: 'import',
          message: `Forbidden import: "${source}"`,
          line: path.node.loc?.start.line || 0,
          column: path.node.loc?.start.column || 0,
          fix: `Remove this import. Only @guardrail/ui and react are allowed.`,
        });
      }
    },

    // Check JSX elements
    JSXOpeningElement(path) {
      const nameNode = path.node.name;

      // Handle simple identifiers (e.g., <div>, <Button>)
      if (nameNode.type === 'JSXIdentifier') {
        const name = nameNode.name;

        // Check for HTML elements (lowercase)
        if (name[0] === name[0].toLowerCase()) {
          if (HTML_ELEMENTS.has(name)) {
            errors.push({
              type: 'element',
              message: `Raw HTML element <${name}> is not allowed`,
              line: path.node.loc?.start.line || 0,
              column: path.node.loc?.start.column || 0,
              fix: `Replace <${name}> with a Guardrail component: Box, Text, Flex, Button, etc.`,
            });
          }
        }
        // Check for unknown components (uppercase but not in allowed set)
        else if (!ALLOWED_COMPONENTS.has(name)) {
          errors.push({
            type: 'element',
            message: `Unknown component <${name}>`,
            line: path.node.loc?.start.line || 0,
            column: path.node.loc?.start.column || 0,
            fix: `Replace <${name}> with a component from @guardrail/ui`,
          });
        }
      }

      // Check for forbidden props
      for (const attr of path.node.attributes) {
        if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
          const propName = attr.name.name;

          if (FORBIDDEN_PROPS.has(propName)) {
            errors.push({
              type: 'prop',
              message: `Forbidden prop: "${propName}"`,
              line: attr.loc?.start.line || 0,
              column: attr.loc?.start.column || 0,
              fix: `Remove ${propName}. Use component props instead (e.g., padding="md", variant="primary")`,
            });
          }
        }
      }
    },
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
