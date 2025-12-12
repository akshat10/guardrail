import { useGalleryStore } from '../../stores/gallery-store';
import type { ComponentDefinition, PropDefinition } from '../../lib/component-registry';

interface PropEditorProps {
  componentDef: ComponentDefinition;
}

export function PropEditor({ componentDef }: PropEditorProps) {
  const propValues = useGalleryStore((state) => state.propValues);
  const setPropValue = useGalleryStore((state) => state.setPropValue);

  // Filter out children prop for simpler editing
  const editableProps = componentDef.props.filter((p) => p.name !== 'children' || p.type === 'string');

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
        Props
      </h3>
      <div className="space-y-4">
        {editableProps.map((prop) => (
          <PropControl
            key={prop.name}
            prop={prop}
            value={propValues[prop.name]}
            onChange={(value) => setPropValue(prop.name, value)}
          />
        ))}
      </div>
    </div>
  );
}

interface PropControlProps {
  prop: PropDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

function PropControl({ prop, value, onChange }: PropControlProps) {
  const id = `prop-${prop.name}`;
  const currentValue = value ?? prop.defaultValue;

  const labelElement = (
    <label
      htmlFor={id}
      className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
    >
      {prop.name}
      {prop.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  switch (prop.type) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {prop.name}
            </span>
            {prop.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{prop.description}</p>
            )}
          </div>
          <button
            id={id}
            role="switch"
            aria-checked={Boolean(currentValue)}
            onClick={() => onChange(!currentValue)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              currentValue ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                currentValue ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      );

    case 'select':
      return (
        <div>
          {labelElement}
          <select
            id={id}
            value={String(currentValue ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Select --</option>
            {prop.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {prop.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{prop.description}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div>
          {labelElement}
          <input
            id={id}
            type="number"
            value={currentValue !== undefined ? String(currentValue) : ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {prop.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{prop.description}</p>
          )}
        </div>
      );

    case 'string':
    case 'node':
    default:
      return (
        <div>
          {labelElement}
          <input
            id={id}
            type="text"
            value={String(currentValue ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={prop.description}
            className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {prop.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{prop.description}</p>
          )}
        </div>
      );
  }
}
