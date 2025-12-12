import { useAppStore, type PromptHistoryItem } from '../stores/app-store';

interface PromptHistoryProps {
  onSelectPrompt: (prompt: string) => void;
}

export function PromptHistory({ onSelectPrompt }: PromptHistoryProps) {
  const promptHistory = useAppStore((state) => state.promptHistory);
  const removeFromHistory = useAppStore((state) => state.removeFromHistory);
  const clearHistory = useAppStore((state) => state.clearHistory);

  if (promptHistory.length === 0) {
    return null;
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncatePrompt = (prompt: string, maxLength = 60) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.slice(0, maxLength) + '...';
  };

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 dark:bg-neutral-900">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          History
        </h3>
        <button
          onClick={clearHistory}
          className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {promptHistory.map((item: PromptHistoryItem) => (
          <div
            key={item.id}
            className="group flex items-start gap-2 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
            onClick={() => onSelectPrompt(item.prompt)}
          >
            <span
              className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                item.success
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}
              title={item.success ? 'Successful' : 'Failed'}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                {truncatePrompt(item.prompt)}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {formatTime(item.timestamp)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFromHistory(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-all"
              title="Remove from history"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
