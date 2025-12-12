import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import {
  getAllowedValues,
  FREE_FORM_PROPS,
  FUNCTION_PROPS,
} from './prop-constraints';

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
  type: 'import' | 'element' | 'prop' | 'value' | 'syntax';
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

      // Get component name for prop validation
      let componentName: string | null = null;
      if (nameNode.type === 'JSXIdentifier') {
        componentName = nameNode.name;
      }

      // Check for forbidden props and validate prop values
      for (const attr of path.node.attributes) {
        if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
          const propName = attr.name.name;

          // Check forbidden props (className, style)
          if (FORBIDDEN_PROPS.has(propName)) {
            errors.push({
              type: 'prop',
              message: `Forbidden prop: "${propName}"`,
              line: attr.loc?.start.line || 0,
              column: attr.loc?.start.column || 0,
              fix: `Remove ${propName}. Use component props instead (e.g., padding="md", variant="primary")`,
            });
            continue;
          }

          // Skip validation for free-form and function props
          if (FREE_FORM_PROPS.has(propName) || FUNCTION_PROPS.has(propName)) {
            continue;
          }

          // Validate prop values for known components
          if (componentName && ALLOWED_COMPONENTS.has(componentName)) {
            const allowedValues = getAllowedValues(componentName, propName);

            // Only validate if we have constraints for this prop
            if (allowedValues) {
              let propValue: string | null = null;

              // Handle string literal values: prop="value"
              if (attr.value?.type === 'StringLiteral') {
                propValue = attr.value.value;
              }
              // Handle JSX expression container with string: prop={"value"}
              else if (
                attr.value?.type === 'JSXExpressionContainer' &&
                attr.value.expression.type === 'StringLiteral'
              ) {
                propValue = attr.value.expression.value;
              }
              // Skip dynamic expressions like prop={variable} or prop={condition ? a : b}
              // These can't be statically validated

              if (propValue !== null && !allowedValues.includes(propValue)) {
                errors.push({
                  type: 'value',
                  message: `Invalid value "${propValue}" for ${componentName}.${propName}`,
                  line: attr.loc?.start.line || 0,
                  column: attr.loc?.start.column || 0,
                  fix: `Use one of: ${allowedValues.join(', ')}`,
                });
              }
            }
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
