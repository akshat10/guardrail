import type { ComponentDefinition } from '../../lib/component-registry';

interface PropDocumentationProps {
  componentDef: ComponentDefinition;
}

export function PropDocumentation({ componentDef }: PropDocumentationProps) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-neutral-900 dark:text-neutral-50">
              Prop
            </th>
            <th className="px-4 py-3 text-left font-semibold text-neutral-900 dark:text-neutral-50">
              Type
            </th>
            <th className="px-4 py-3 text-left font-semibold text-neutral-900 dark:text-neutral-50">
              Default
            </th>
            <th className="px-4 py-3 text-left font-semibold text-neutral-900 dark:text-neutral-50">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {componentDef.props.map((prop) => (
            <tr key={prop.name} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
              <td className="px-4 py-3">
                <code className="text-primary-600 dark:text-primary-400 font-medium">
                  {prop.name}
                </code>
                {prop.required && (
                  <span className="ml-1 text-red-500 text-xs">required</span>
                )}
              </td>
              <td className="px-4 py-3">
                <code className="text-neutral-600 dark:text-neutral-400 text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                  {prop.options ? prop.options.map((o) => `'${o}'`).join(' | ') : prop.type}
                </code>
              </td>
              <td className="px-4 py-3">
                {prop.defaultValue !== undefined ? (
                  <code className="text-neutral-600 dark:text-neutral-400 text-xs">
                    {JSON.stringify(prop.defaultValue)}
                  </code>
                ) : (
                  <span className="text-neutral-400 dark:text-neutral-600">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {componentDef.isCompound && componentDef.compoundComponents && (
        <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Compound Components
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            This component is designed to be used with the following sub-components:
          </p>
          <div className="flex flex-wrap gap-2">
            {componentDef.compoundComponents.map((name) => (
              <code
                key={name}
                className="px-2 py-1 text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded"
              >
                {name}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
