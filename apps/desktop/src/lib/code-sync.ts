/**
 * Code Sync
 *
 * Provides functions to update component props in code
 * while preserving formatting as much as possible.
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import type { ParsedProp } from './component-parser';

/**
 * Update a single prop value in the code
 */
export function updatePropInCode(
  code: string,
  componentLine: number,
  componentColumn: number,
  propName: string,
  newValue: string | number | boolean
): string {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  let modified = false;

  traverse(ast, {
    JSXOpeningElement(path) {
      // Match by line/column
      if (
        path.node.loc?.start.line !== componentLine ||
        path.node.loc?.start.column !== componentColumn
      ) {
        return;
      }

      for (const attr of path.node.attributes) {
        if (
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          attr.name.name === propName
        ) {
          // Update existing prop
          attr.value = createJSXValue(newValue);
          modified = true;
          return;
        }
      }

      // Prop doesn't exist, add it
      const newAttr = t.jsxAttribute(
        t.jsxIdentifier(propName),
        createJSXValue(newValue)
      );
      path.node.attributes.push(newAttr);
      modified = true;
    },
  });

  if (!modified) {
    console.warn(`[code-sync] Could not find component at line ${componentLine}, column ${componentColumn}`);
    return code;
  }

  // Generate code with preserved formatting
  const result = generate(ast, {
    retainLines: true,
    retainFunctionParens: true,
  });

  return result.code;
}

/**
 * Remove a prop from a component
 */
export function removePropFromCode(
  code: string,
  componentLine: number,
  componentColumn: number,
  propName: string
): string {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  let modified = false;

  traverse(ast, {
    JSXOpeningElement(path) {
      if (
        path.node.loc?.start.line !== componentLine ||
        path.node.loc?.start.column !== componentColumn
      ) {
        return;
      }

      const attrIndex = path.node.attributes.findIndex(
        (attr) =>
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          attr.name.name === propName
      );

      if (attrIndex !== -1) {
        path.node.attributes.splice(attrIndex, 1);
        modified = true;
      }
    },
  });

  if (!modified) {
    return code;
  }

  const result = generate(ast, {
    retainLines: true,
    retainFunctionParens: true,
  });

  return result.code;
}

/**
 * Update multiple props at once
 */
export function updateMultiplePropsInCode(
  code: string,
  componentLine: number,
  componentColumn: number,
  propsToUpdate: Record<string, string | number | boolean | null>
): string {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  traverse(ast, {
    JSXOpeningElement(path) {
      if (
        path.node.loc?.start.line !== componentLine ||
        path.node.loc?.start.column !== componentColumn
      ) {
        return;
      }

      for (const [propName, newValue] of Object.entries(propsToUpdate)) {
        if (newValue === null) {
          // Remove the prop
          const attrIndex = path.node.attributes.findIndex(
            (attr) =>
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'JSXIdentifier' &&
              attr.name.name === propName
          );
          if (attrIndex !== -1) {
            path.node.attributes.splice(attrIndex, 1);
          }
        } else {
          // Update or add the prop
          const existingAttr = path.node.attributes.find(
            (attr) =>
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'JSXIdentifier' &&
              attr.name.name === propName
          );

          if (existingAttr && existingAttr.type === 'JSXAttribute') {
            existingAttr.value = createJSXValue(newValue);
          } else {
            const newAttr = t.jsxAttribute(
              t.jsxIdentifier(propName),
              createJSXValue(newValue)
            );
            path.node.attributes.push(newAttr);
          }
        }
      }
    },
  });

  const result = generate(ast, {
    retainLines: true,
    retainFunctionParens: true,
  });

  return result.code;
}

/**
 * Create appropriate JSX value node based on value type
 */
function createJSXValue(
  value: string | number | boolean
): t.StringLiteral | t.JSXExpressionContainer | null {
  if (typeof value === 'string') {
    return t.stringLiteral(value);
  }

  if (typeof value === 'number') {
    return t.jsxExpressionContainer(t.numericLiteral(value));
  }

  if (typeof value === 'boolean') {
    if (value === true) {
      // Boolean true is typically written as shorthand: <Button disabled />
      // But we use explicit for consistency
      return t.jsxExpressionContainer(t.booleanLiteral(true));
    }
    return t.jsxExpressionContainer(t.booleanLiteral(false));
  }

  return null;
}

/**
 * Sync prop change to file system
 */
export async function syncPropChange(
  projectPath: string,
  componentLine: number,
  componentColumn: number,
  propName: string,
  newValue: string | number | boolean
): Promise<string> {
  const appTsxPath = await join(projectPath, 'src', 'App.tsx');

  // Read current code
  const currentCode = await readTextFile(appTsxPath);

  // Update the prop
  const updatedCode = updatePropInCode(
    currentCode,
    componentLine,
    componentColumn,
    propName,
    newValue
  );

  // Write back to file
  await writeTextFile(appTsxPath, updatedCode);

  return updatedCode;
}

/**
 * Sync multiple prop changes to file system
 */
export async function syncMultiplePropChanges(
  projectPath: string,
  componentLine: number,
  componentColumn: number,
  propsToUpdate: Record<string, string | number | boolean | null>
): Promise<string> {
  const appTsxPath = await join(projectPath, 'src', 'App.tsx');

  // Read current code
  const currentCode = await readTextFile(appTsxPath);

  // Update the props
  const updatedCode = updateMultiplePropsInCode(
    currentCode,
    componentLine,
    componentColumn,
    propsToUpdate
  );

  // Write back to file
  await writeTextFile(appTsxPath, updatedCode);

  return updatedCode;
}

/**
 * Simple string-based prop update (more reliable for simple cases)
 * Uses character positions directly to replace values
 */
export function updatePropByPosition(
  code: string,
  prop: ParsedProp,
  newValue: string | number | boolean
): string {
  // For string values, create new string literal
  let replacement: string;

  if (typeof newValue === 'string') {
    replacement = `"${newValue}"`;
  } else if (typeof newValue === 'number') {
    replacement = `{${newValue}}`;
  } else if (typeof newValue === 'boolean') {
    replacement = `{${newValue}}`;
  } else {
    return code;
  }

  // Replace the value at the prop's position
  return code.slice(0, prop.start) + replacement + code.slice(prop.end);
}
