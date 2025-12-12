import { useAppStore } from '../stores/app-store';

const statusMessages: Record<string, { text: string; color: string }> = {
  initializing: { text: 'Initializing...', color: 'text-yellow-600 dark:text-yellow-400' },
  'no-claude-code': { text: 'Claude Code not found', color: 'text-red-600 dark:text-red-400' },
  'no-project': { text: 'No project open', color: 'text-neutral-500 dark:text-neutral-400' },
  idle: { text: 'Ready', color: 'text-green-600 dark:text-green-400' },
  generating: { text: 'Generating...', color: 'text-blue-600 dark:text-blue-400' },
  validating: { text: 'Validating...', color: 'text-yellow-600 dark:text-yellow-400' },
  fixing: { text: 'Fixing violations...', color: 'text-yellow-600 dark:text-yellow-400' },
  ready: { text: 'Valid', color: 'text-green-600 dark:text-green-400' },
  error: { text: 'Error', color: 'text-red-600 dark:text-red-400' },
};

export function StatusBar() {
  const status = useAppStore((state) => state.status);
  const error = useAppStore((state) => state.error);
  const fixAttempts = useAppStore((state) => state.fixAttempts);

  const statusInfo = statusMessages[status] || { text: status, color: 'text-neutral-500' };

  return (
    <div className="h-8 px-4 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs">
      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'ready' || status === 'idle'
                ? 'bg-green-500'
                : status === 'generating' || status === 'validating' || status === 'fixing'
                ? 'bg-yellow-500 animate-pulse'
                : status === 'error' || status === 'no-claude-code'
                ? 'bg-red-500'
                : 'bg-neutral-400'
            }`}
          />
          <span className={statusInfo.color}>{statusInfo.text}</span>
        </div>

        {/* Fix attempts */}
        {fixAttempts > 0 && (
          <span className="text-neutral-500 dark:text-neutral-400">
            Fix attempt {fixAttempts}/3
          </span>
        )}

        {/* Error message */}
        {error && (
          <span className="text-red-600 dark:text-red-400 truncate max-w-md">{error}</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-neutral-500 dark:text-neutral-400">
        <span>Guardrail v0.1.0</span>
      </div>
    </div>
  );
}
