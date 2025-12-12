import { useGalleryStore } from '../../stores/gallery-store';
import type { ComponentDefinition } from '../../lib/component-registry';

interface VariantShowcaseProps {
  componentDef: ComponentDefinition;
}

export function VariantShowcase({ componentDef }: VariantShowcaseProps) {
  const selectComponent = useGalleryStore((state) => state.selectComponent);
  const Component = componentDef.component;

  const handleApplyVariant = (variantProps: Record<string, unknown>) => {
    selectComponent(componentDef.name, variantProps);
  };

  // Special rendering for certain components
  const renderComponent = (props: Record<string, unknown>) => {
    if (componentDef.name === 'Select') {
      return (
        <Component
          {...props}
          options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
          ]}
        />
      );
    }

    if (componentDef.name === 'Card') {
      return (
        <Component {...props}>
          {props.children || (
            <div className="p-4">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-50">Card</h4>
              <p className="text-sm text-neutral-500">Content</p>
            </div>
          )}
        </Component>
      );
    }

    if (componentDef.name === 'Divider') {
      const orientation = props.orientation as string || 'horizontal';
      if (orientation === 'vertical') {
        return (
          <div className="flex items-stretch h-12">
            <span className="text-sm text-neutral-500">Left</span>
            <Component {...props} />
            <span className="text-sm text-neutral-500">Right</span>
          </div>
        );
      }
    }

    if (componentDef.name === 'Spacer') {
      return (
        <div className="flex flex-col items-center">
          <div className="w-16 h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <Component {...props} />
          <div className="w-16 h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      );
    }

    return <Component {...props} />;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {componentDef.variants.map((variant) => (
        <div
          key={variant.name}
          className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
        >
          <div className="mb-3">
            <h4 className="font-medium text-neutral-900 dark:text-neutral-50">{variant.name}</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{variant.description}</p>
          </div>

          <div className="flex items-center justify-center min-h-[80px] bg-neutral-50 dark:bg-neutral-900 rounded p-4 mb-3">
            {renderComponent(variant.props)}
          </div>

          <button
            onClick={() => handleApplyVariant(variant.props)}
            className="w-full px-3 py-1.5 text-xs font-medium rounded-md text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors"
          >
            Apply to Preview
          </button>
        </div>
      ))}
    </div>
  );
}
