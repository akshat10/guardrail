import { useState, useEffect, useCallback } from 'react';
import { usePermissionStore } from '../stores/permission-store';
import {
  getCategoryEmoji,
  getCategoryLabel,
  getRiskLevel,
  getRiskColor,
  formatToolInput,
  getPreviewContent,
  createPatternFromRequest,
} from '../lib/permission-utils';

interface PermissionDialogProps {
  onDecision?: (id: string, decision: 'approved' | 'denied', forSession: boolean) => void;
}

export function PermissionDialog({ onDecision }: PermissionDialogProps) {
  const currentRequest = usePermissionStore((state) => state.getCurrentRequest());
  const resolveRequest = usePermissionStore((state) => state.resolveRequest);
  const addSessionPermission = usePermissionStore((state) => state.addSessionPermission);
  const project = usePermissionStore((state) => state.sessionPermissions[0]?.projectPath);

  const [forSession, setForSession] = useState(false);

  // Reset checkbox when request changes
  useEffect(() => {
    setForSession(false);
  }, [currentRequest?.id]);

  const handleDecision = useCallback((decision: 'approved' | 'denied') => {
    if (!currentRequest) return;

    // Add session permission if requested
    if (decision === 'approved' && forSession) {
      const pattern = createPatternFromRequest(
        currentRequest.toolName,
        currentRequest.toolInput,
        currentRequest.toolInput.command ? 'command' : 'tool'
      );
      addSessionPermission({
        ...pattern,
        projectPath: project || '',
      });
    }

    resolveRequest(currentRequest.id, decision);
    onDecision?.(currentRequest.id, decision, forSession);
  }, [currentRequest, forSession, resolveRequest, addSessionPermission, onDecision, project]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!currentRequest) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleDecision('approved');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleDecision('denied');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRequest, handleDecision]);

  if (!currentRequest) return null;

  const riskLevel = getRiskLevel(currentRequest.category);
  const riskColor = getRiskColor(currentRequest.category);
  const preview = getPreviewContent(currentRequest.toolInput);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          riskLevel === 'high'
            ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
            : riskLevel === 'medium'
            ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
            : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getCategoryEmoji(currentRequest.category)}</span>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Permission Request
              </h2>
              <p className={`text-sm ${riskColor}`}>
                {riskLevel === 'high' ? 'High risk operation' :
                 riskLevel === 'medium' ? 'Moderate risk operation' :
                 'Low risk operation'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Action description */}
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              Claude wants to:
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
                {getCategoryLabel(currentRequest.category)}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded">
              {formatToolInput(currentRequest.toolName, currentRequest.toolInput)}
            </p>
          </div>

          {/* Preview */}
          {preview && (
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                Content Preview:
              </p>
              <pre className="text-xs font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 p-3 rounded max-h-40 overflow-auto">
                {preview}
              </pre>
            </div>
          )}

          {/* Session checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={forSession}
              onChange={(e) => setForSession(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Allow for this session (won't ask again for similar operations)
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Enter to allow, Escape to deny
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleDecision('denied')}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300
                       bg-neutral-200 dark:bg-neutral-700 rounded-md
                       hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            >
              Deny
            </button>
            <button
              onClick={() => handleDecision('approved')}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md
                       hover:bg-primary-700 transition-colors"
            >
              Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pre-execution consent dialog for showing what Claude will do
 */
interface ConsentDialogProps {
  isOpen: boolean;
  prompt: string;
  onApprove: () => void;
  onCancel: () => void;
}

export function ConsentDialog({ isOpen, prompt, onApprove, onCancel }: ConsentDialogProps) {
  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onApprove();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onApprove, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Generate Component
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Review what Claude will do before proceeding
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Prompt */}
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              Your request:
            </p>
            <p className="text-sm text-neutral-900 dark:text-neutral-50 bg-neutral-100 dark:bg-neutral-800 p-3 rounded">
              {prompt}
            </p>
          </div>

          {/* What will happen */}
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
              Claude will:
            </p>
            <ul className="text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Read project files to understand context
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">✓</span>
                Write changes to <code className="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">src/App.tsx</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                Follow guardrail rules in CLAUDE.md
              </li>
            </ul>
          </div>

          {/* Safety note */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Safety:</strong> Generated code will be validated before being applied.
              Only @guardrail/ui components are allowed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Enter to proceed, Escape to cancel
          </span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300
                       bg-neutral-200 dark:bg-neutral-700 rounded-md
                       hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onApprove}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md
                       hover:bg-primary-700 transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
