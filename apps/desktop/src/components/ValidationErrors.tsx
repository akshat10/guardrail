import type { ValidationError } from '../lib/validator';

interface ValidationErrorsProps {
  errors: ValidationError[];
}

const errorTypeIcons: Record<ValidationError['type'], string> = {
  import: '📦',
  element: '🏷️',
  prop: '⚙️',
  value: '🎨',
  syntax: '❌',
};

const errorTypeLabels: Record<ValidationError['type'], string> = {
  import: 'Import Violation',
  element: 'Element Violation',
  prop: 'Prop Violation',
  value: 'Invalid Token Value',
  syntax: 'Syntax Error',
};

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
          <span>⚠️</span>
          {errors.length} Validation {errors.length === 1 ? 'Error' : 'Errors'}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          The generated code doesn't comply with Guardrail rules. Attempting auto-fix...
        </p>
      </div>

      <div className="space-y-3">
        {errors.map((error, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{errorTypeIcons[error.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200">
                    {errorTypeLabels[error.type]}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Line {error.line}, Column {error.column}
                  </span>
                </div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  {error.message}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">Suggested fix:</span> {error.fix}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
