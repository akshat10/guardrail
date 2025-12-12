import { useState } from 'react';
import type { ComponentDefinition } from '../../lib/component-registry';

interface CodeDisplayProps {
  componentDef: ComponentDefinition;
  propValues: Record<string, unknown>;
}

export function CodeDisplay({ componentDef, propValues }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const generateCode = (): string => {
    const { name, props: propDefs } = componentDef;

    // Filter props that differ from defaults and aren't undefined
    const propsToShow: string[] = [];

    propDefs.forEach((propDef) => {
      const value = propValues[propDef.name];
      const defaultValue = propDef.defaultValue;

      // Skip if value is undefined or same as default
      if (value === undefined || value === '' || value === defaultValue) {
        return;
      }

      // Format the prop string
      if (propDef.name === 'children') {
        // Children will be handled separately
        return;
      }

      if (typeof value === 'boolean') {
        if (value) {
          propsToShow.push(propDef.name);
        }
      } else if (typeof value === 'string') {
        propsToShow.push(`${propDef.name}="${value}"`);
      } else if (typeof value === 'number') {
        propsToShow.push(`${propDef.name}={${value}}`);
      }
    });

    const childrenValue = propValues.children;
    const hasChildren = childrenValue && childrenValue !== '';

    // Build the JSX string
    const propsString = propsToShow.length > 0 ? ' ' + propsToShow.join(' ') : '';

    if (hasChildren && typeof childrenValue === 'string') {
      return `<${name}${propsString}>\n  ${childrenValue}\n</${name}>`;
    }

    if (propsString) {
      return `<${name}${propsString} />`;
    }

    return `<${name} />`;
  };

  const code = generateCode();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative rounded-lg bg-neutral-900 dark:bg-neutral-950 border border-neutral-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <span className="text-xs font-medium text-neutral-400">JSX</span>
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs font-medium rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-green-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </span>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-neutral-200 font-mono">{code}</code>
      </pre>
    </div>
  );
}
