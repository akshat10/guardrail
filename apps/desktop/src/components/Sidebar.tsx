import React from 'react';
import { useAppStore } from '../stores/app-store';

const COMPONENT_REFERENCE = [
  {
    category: 'Primitives',
    components: ['Box', 'Flex', 'Grid', 'Text', 'Spacer'],
  },
  {
    category: 'Elements',
    components: [
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
    ],
  },
  {
    category: 'Components',
    components: [
      'Card',
      'CardHeader',
      'CardTitle',
      'CardContent',
      'CardFooter',
      'Modal',
      'ModalTrigger',
      'ModalContent',
      'Tabs',
      'TabsList',
      'TabsTrigger',
      'TabsContent',
      'Alert',
      'Tooltip',
    ],
  },
];

export function Sidebar() {
  const project = useAppStore((state) => state.project);

  return (
    <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      {/* Project Info */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          {project?.name || 'No Project'}
        </h2>
        {project && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
            {project.path}
          </p>
        )}
      </div>

      {/* Component Reference */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          Component Reference
        </h3>
        <div className="space-y-4">
          {COMPONENT_REFERENCE.map((section) => (
            <div key={section.category}>
              <h4 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {section.category}
              </h4>
              <div className="flex flex-wrap gap-1">
                {section.components.map((component) => (
                  <span
                    key={component}
                    className="px-2 py-0.5 text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded"
                  >
                    {component}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Link */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <a
          href="https://github.com/guardrail-dev/guardrail"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
        >
          Documentation →
        </a>
      </div>
    </aside>
  );
}
