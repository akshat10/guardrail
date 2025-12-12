/**
 * Component Parser
 *
 * Parses generated React code to extract a tree of components
 * with their props, for use in the visual prop editor.
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import type { JSXAttribute, JSXOpeningElement, JSXElement } from '@babel/types';

export interface ParsedProp {
  name: string;
  value: string | number | boolean | null;
  type: 'string' | 'number' | 'boolean' | 'expression' | 'null';
  line: number;
  column: number;
  // Character positions for precise editing
  start: number;
  end: number;
}

export interface ParsedComponent {
  id: string;
  name: string;
  props: ParsedProp[];
  line: number;
  column: number;
  // Character positions for the opening element
  start: number;
  end: number;
  // The full JSX element range (including children and closing tag)
  elementStart: number;
  elementEnd: number;
  children: ParsedComponent[];
}

let componentIdCounter = 0;

function generateComponentId(): string {
  return `component-${++componentIdCounter}`;
}

/**
 * Extract prop value from a JSX attribute
 */
function extractPropValue(attr: JSXAttribute): {
  value: string | number | boolean | null;
  type: ParsedProp['type'];
  start: number;
  end: number;
} {
  const attrValue = attr.value;

  // Boolean shorthand: <Button disabled />
  if (attrValue === null || attrValue === undefined) {
    return {
      value: true,
      type: 'boolean',
      start: attr.start || 0,
      end: attr.end || 0,
    };
  }

  // String literal: prop="value"
  if (attrValue.type === 'StringLiteral') {
    return {
      value: attrValue.value,
      type: 'string',
      start: attrValue.start || 0,
      end: attrValue.end || 0,
    };
  }

  // JSX Expression Container: prop={...}
  if (attrValue.type === 'JSXExpressionContainer') {
    const expr = attrValue.expression;
    const containerStart = attrValue.start || 0;
    const containerEnd = attrValue.end || 0;

    // String inside expression: prop={"value"}
    if (expr.type === 'StringLiteral') {
      return {
        value: expr.value,
        type: 'string',
        start: containerStart,
        end: containerEnd,
      };
    }

    // Number: prop={42}
    if (expr.type === 'NumericLiteral') {
      return {
        value: expr.value,
        type: 'number',
        start: containerStart,
        end: containerEnd,
      };
    }

    // Boolean: prop={true}
    if (expr.type === 'BooleanLiteral') {
      return {
        value: expr.value,
        type: 'boolean',
        start: containerStart,
        end: containerEnd,
      };
    }

    // Null: prop={null}
    if (expr.type === 'NullLiteral') {
      return {
        value: null,
        type: 'null',
        start: containerStart,
        end: containerEnd,
      };
    }

    // Expression (variable, function call, etc.)
    // We can't edit these statically, but we track them
    return {
      value: null,
      type: 'expression',
      start: containerStart,
      end: containerEnd,
    };
  }

  // Other value types (JSX elements, etc.)
  return {
    value: null,
    type: 'expression',
    start: attrValue.start || 0,
    end: attrValue.end || 0,
  };
}

/**
 * Parse JSX opening element to extract component info
 */
function parseOpeningElement(node: JSXOpeningElement): Omit<ParsedComponent, 'children' | 'elementStart' | 'elementEnd'> | null {
  // Only handle simple identifiers (Box, Button, etc.)
  if (node.name.type !== 'JSXIdentifier') {
    return null;
  }

  const name = node.name.name;

  // Skip React built-ins and fragments
  if (name === 'Fragment' || name[0] === name[0].toLowerCase()) {
    return null;
  }

  const props: ParsedProp[] = [];

  for (const attr of node.attributes) {
    // Only handle regular attributes, not spread
    if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') {
      continue;
    }

    const propName = attr.name.name;
    const { value, type, start, end } = extractPropValue(attr);

    props.push({
      name: propName,
      value,
      type,
      line: attr.loc?.start.line || 0,
      column: attr.loc?.start.column || 0,
      start,
      end,
    });
  }

  return {
    id: generateComponentId(),
    name,
    props,
    line: node.loc?.start.line || 0,
    column: node.loc?.start.column || 0,
    start: node.start || 0,
    end: node.end || 0,
  };
}

/**
 * Recursively parse JSX element and its children
 */
function parseJSXElement(node: JSXElement): ParsedComponent | null {
  const component = parseOpeningElement(node.openingElement);

  if (!component) {
    return null;
  }

  const children: ParsedComponent[] = [];

  for (const child of node.children) {
    if (child.type === 'JSXElement') {
      const parsedChild = parseJSXElement(child);
      if (parsedChild) {
        children.push(parsedChild);
      }
    } else if (child.type === 'JSXFragment') {
      // Flatten fragment children
      for (const fragmentChild of child.children) {
        if (fragmentChild.type === 'JSXElement') {
          const parsedChild = parseJSXElement(fragmentChild);
          if (parsedChild) {
            children.push(parsedChild);
          }
        }
      }
    }
  }

  return {
    ...component,
    elementStart: node.start || 0,
    elementEnd: node.end || 0,
    children,
  };
}

/**
 * Parse component code and extract component tree
 */
export function parseComponentTree(code: string): ParsedComponent[] {
  // Reset ID counter for consistent IDs
  componentIdCounter = 0;

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch {
    return [];
  }

  const components: ParsedComponent[] = [];

  traverse(ast, {
    // Find the return statement in the default export function
    ReturnStatement(path) {
      const arg = path.node.argument;

      if (arg?.type === 'JSXElement') {
        const parsed = parseJSXElement(arg);
        if (parsed) {
          components.push(parsed);
        }
      } else if (arg?.type === 'JSXFragment') {
        // Handle fragment return
        for (const child of arg.children) {
          if (child.type === 'JSXElement') {
            const parsed = parseJSXElement(child);
            if (parsed) {
              components.push(parsed);
            }
          }
        }
      }
    },
  });

  return components;
}

/**
 * Find a component by its ID in the tree
 */
export function findComponentById(
  components: ParsedComponent[],
  id: string
): ParsedComponent | null {
  for (const component of components) {
    if (component.id === id) {
      return component;
    }
    const found = findComponentById(component.children, id);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * Get all components as a flat list
 */
export function flattenComponents(components: ParsedComponent[]): ParsedComponent[] {
  const result: ParsedComponent[] = [];

  function traverse(items: ParsedComponent[]) {
    for (const item of items) {
      result.push(item);
      traverse(item.children);
    }
  }

  traverse(components);
  return result;
}

/**
 * Find a prop by name in a component
 */
export function findPropByName(
  component: ParsedComponent,
  propName: string
): ParsedProp | null {
  return component.props.find((p) => p.name === propName) || null;
}

/**
 * Get component path (breadcrumb) from root to target
 */
export function getComponentPath(
  components: ParsedComponent[],
  targetId: string
): ParsedComponent[] {
  function findPath(
    items: ParsedComponent[],
    path: ParsedComponent[]
  ): ParsedComponent[] | null {
    for (const item of items) {
      const newPath = [...path, item];
      if (item.id === targetId) {
        return newPath;
      }
      const found = findPath(item.children, newPath);
      if (found) {
        return found;
      }
    }
    return null;
  }

  return findPath(components, []) || [];
}
