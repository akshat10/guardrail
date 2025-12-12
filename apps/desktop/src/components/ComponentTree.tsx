/**
 * ComponentTree - Figma-like layers panel
 *
 * Shows the component hierarchy from generated code.
 * Click to select and edit props.
 */

import { useEffect } from 'react';
import { useAppStore } from '../stores/app-store';
import { parseComponentTree, type ParsedComponent } from '../lib/component-parser';

export function ComponentTree() {
  const generatedCode = useAppStore((state) => state.generatedCode);
  const parsedComponents = useAppStore((state) => state.parsedComponents);
  const selectedComponentId = useAppStore((state) => state.selectedComponentId);
  const setParsedComponents = useAppStore((state) => state.setParsedComponents);
  const setSelectedComponent = useAppStore((state) => state.setSelectedComponent);

  // Parse component tree when code changes
  useEffect(() => {
    if (generatedCode) {
      const components = parseComponentTree(generatedCode);
      setParsedComponents(components);
    } else {
      setParsedComponents([]);
      setSelectedComponent(null);
    }
  }, [generatedCode, setParsedComponents, setSelectedComponent]);

  if (!generatedCode || parsedComponents.length === 0) {
    return (
      <div className="p-4 text-center text-neutral-500 dark:text-neutral-400 text-sm">
        <p>No components yet</p>
        <p className="text-xs mt-1">Generate code to see the component tree</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase px-2 mb-2">
        Layers
      </div>
      <div className="space-y-0.5">
        {parsedComponents.map((component) => (
          <ComponentTreeItem
            key={component.id}
            component={component}
            selectedId={selectedComponentId}
            onSelect={setSelectedComponent}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

interface ComponentTreeItemProps {
  component: ParsedComponent;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  depth: number;
}

function ComponentTreeItem({
  component,
  selectedId,
  onSelect,
  depth,
}: ComponentTreeItemProps) {
  const isSelected = selectedId === component.id;
  const hasChildren = component.children.length > 0;

  // Get a summary of key props
  const propSummary = component.props
    .filter((p) => ['variant', 'size', 'padding', 'direction', 'gap'].includes(p.name))
    .map((p) => `${p.name}="${p.value}"`)
    .slice(0, 2)
    .join(' ');

  return (
    <>
      <button
        onClick={() => onSelect(isSelected ? null : component.id)}
        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
          isSelected
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {/* Expand indicator */}
        <span className="w-4 text-neutral-400">
          {hasChildren ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <span className="w-3 h-3 block" />
          )}
        </span>

        {/* Component icon */}
        <span className="text-xs">
          {getComponentIcon(component.name)}
        </span>

        {/* Component name */}
        <span className="font-medium">{component.name}</span>

        {/* Prop summary */}
        {propSummary && (
          <span className="text-xs text-neutral-400 truncate ml-auto">
            {propSummary}
          </span>
        )}
      </button>

      {/* Children */}
      {hasChildren && (
        <div>
          {component.children.map((child) => (
            <ComponentTreeItem
              key={child.id}
              component={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}

function getComponentIcon(name: string): string {
  const icons: Record<string, string> = {
    // Primitives
    Box: '📦',
    Flex: '↔️',
    Grid: '⊞',
    Text: '📝',
    Spacer: '↕️',
    // Elements
    Button: '🔘',
    Input: '📥',
    Textarea: '📄',
    Checkbox: '☑️',
    Switch: '🔀',
    Select: '📋',
    Badge: '🏷️',
    Avatar: '👤',
    Link: '🔗',
    Divider: '➖',
    // Components
    Card: '🃏',
    CardHeader: '📰',
    CardTitle: '📌',
    CardDescription: '📃',
    CardContent: '📑',
    CardFooter: '📎',
    Modal: '🪟',
    Tabs: '📂',
    Alert: '⚠️',
    Tooltip: '💬',
  };
  return icons[name] || '🧩';
}
