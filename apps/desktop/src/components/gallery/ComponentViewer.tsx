import { useState } from 'react';
import { useGalleryStore } from '../../stores/gallery-store';
import { getComponent, getDefaultProps } from '../../lib/component-registry';
import { ComponentPreview } from './ComponentPreview';
import { PropEditor } from './PropEditor';
import { StyleEditor } from './StyleEditor';
import { PropDocumentation } from './PropDocumentation';
import { VariantShowcase } from './VariantShowcase';
import { CodeDisplay } from './CodeDisplay';

type TabValue = 'preview' | 'variants' | 'props';

export function ComponentViewer() {
  const [activeTab, setActiveTab] = useState<TabValue>('preview');
  const selectedComponent = useGalleryStore((state) => state.selectedComponent);
  const propValues = useGalleryStore((state) => state.propValues);
  const resetProps = useGalleryStore((state) => state.resetProps);

  if (!selectedComponent) return null;

  const componentDef = getComponent(selectedComponent);
  if (!componentDef) return null;

  const handleReset = () => {
    resetProps(getDefaultProps(selectedComponent));
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'preview', label: 'Preview' },
    { value: 'variants', label: 'Variants' },
    { value: 'props', label: 'Props' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                {componentDef.name}
              </h1>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize">
                {componentDef.layer}
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {componentDef.description}
            </p>
          </div>
          {activeTab === 'preview' && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm font-medium rounded-md text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Reset Props
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-md w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                activeTab === tab.value
                  ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'preview' && (
          <div className="h-full flex">
            {/* Preview Area */}
            <div className="flex-1 p-6 flex flex-col">
              <ComponentPreview componentDef={componentDef} propValues={propValues} />
              <div className="mt-4">
                <CodeDisplay componentDef={componentDef} propValues={propValues} />
              </div>
            </div>

            {/* Sidebar: Props + Styles */}
            <div className="w-80 border-l border-neutral-200 dark:border-neutral-800 overflow-auto">
              <PropEditor componentDef={componentDef} />
              <div className="border-t border-neutral-200 dark:border-neutral-800">
                <StyleEditor componentDef={componentDef} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variants' && (
          <div className="p-6">
            <VariantShowcase componentDef={componentDef} />
          </div>
        )}

        {activeTab === 'props' && (
          <div className="p-6">
            <PropDocumentation componentDef={componentDef} />
          </div>
        )}
      </div>
    </div>
  );
}
