import { useAppStore, type ViewMode } from '../stores/app-store';
import { useGalleryStore } from '../stores/gallery-store';
import { getDefaultProps } from '../lib/component-registry';

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
    components: ['Card', 'Modal', 'Tabs', 'Alert', 'Tooltip'],
  },
];

export function Sidebar() {
  const project = useAppStore((state) => state.project);
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const selectedComponent = useGalleryStore((state) => state.selectedComponent);
  const selectComponent = useGalleryStore((state) => state.selectComponent);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'workspace') {
      // Clear gallery selection when switching to workspace
      useGalleryStore.getState().clearSelection();
    }
  };

  const handleComponentClick = (componentName: string) => {
    // Switch to gallery view and select the component
    setViewMode('gallery');
    selectComponent(componentName, getDefaultProps(componentName));
  };

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

      {/* View Mode Toggle */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-1 p-1 bg-neutral-200 dark:bg-neutral-800 rounded-md">
          <button
            onClick={() => handleViewModeChange('workspace')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'workspace'
                ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => handleViewModeChange('gallery')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'gallery'
                ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
            }`}
          >
            Gallery
          </button>
        </div>
      </div>

      {/* Component Reference */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          {viewMode === 'gallery' ? 'Select Component' : 'Component Reference'}
        </h3>
        <div className="space-y-4">
          {COMPONENT_REFERENCE.map((section) => (
            <div key={section.category}>
              <h4 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {section.category}
              </h4>
              <div className="flex flex-col gap-1">
                {section.components.map((component) => {
                  const isSelected = viewMode === 'gallery' && selectedComponent === component;
                  return (
                    <button
                      key={component}
                      onClick={() => handleComponentClick(component)}
                      className={`px-2 py-1 text-xs text-left rounded transition-colors ${
                        isSelected
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50'
                      }`}
                    >
                      {component}
                    </button>
                  );
                })}
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
          Documentation
        </a>
      </div>
    </aside>
  );
}
