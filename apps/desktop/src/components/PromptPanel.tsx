import { useState, useCallback, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { useAppStore } from '../stores/app-store';
import { useClaudeCode } from '../hooks/useClaudeCode';
import { ConsentDialog } from './PermissionDialog';
import { PromptHistory } from './PromptHistory';

export function PromptPanel() {
  const prompt = useAppStore((state) => state.prompt);
  const setPrompt = useAppStore((state) => state.setPrompt);
  const status = useAppStore((state) => state.status);
  const streamingOutput = useAppStore((state) => state.streamingOutput);
  const isStreamStarted = useAppStore((state) => state.isStreamStarted);
  const { generateCode, cancel } = useClaudeCode();

  const [showConsent, setShowConsent] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const isGenerating = status === 'generating' || status === 'validating' || status === 'fixing';

  // Auto-scroll to bottom when streaming output changes
  useEffect(() => {
    if (outputRef.current && streamingOutput) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamingOutput]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    // Show consent dialog before generating
    setShowConsent(true);
  };

  const handleApproveGeneration = useCallback(async () => {
    setShowConsent(false);
    await generateCode(prompt);
  }, [generateCode, prompt]);

  const handleCancelGeneration = useCallback(() => {
    setShowConsent(false);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating) {
        setShowConsent(true);
      }
    }
  };

  const handleSelectHistoryPrompt = useCallback((selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  }, [setPrompt]);

  return (
    <div className="h-full flex flex-col">
      {/* Prompt Input */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
        >
          What would you like to build?
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Create a settings page with email notifications toggle, profile section with avatar, and a save button"
          rows={4}
          disabled={isGenerating}
          className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700
                     bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50
                     placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                     disabled:opacity-50 disabled:cursor-not-allowed resize-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Press ⌘+Enter to generate
          </span>
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md
                       hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </form>

      {/* Streaming Output / Loading / History */}
      {isGenerating || streamingOutput ? (
        <div ref={outputRef} className="flex-1 overflow-auto p-4 bg-neutral-50 dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Claude Output
            </h3>
            {isGenerating && (
              <button
                onClick={cancel}
                className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700
                           dark:text-red-400 dark:hover:text-red-300 transition-colors
                           hover:bg-red-50 dark:hover:bg-red-950 rounded"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Loading state before first token */}
          {isGenerating && !isStreamStarted && (
            <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400 py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
              <span className="text-sm">Waiting for Claude...</span>
            </div>
          )}

          {/* Streaming text with cursor */}
          {streamingOutput && (
            <pre className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
              {streamingOutput}
              {isGenerating && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-primary-500 animate-pulse" />
              )}
            </pre>
          )}
        </div>
      ) : (
        /* Prompt History - show when not generating */
        <div className="flex-1 overflow-auto">
          <PromptHistory onSelectPrompt={handleSelectHistoryPrompt} />
        </div>
      )}

      {/* Consent Dialog */}
      <ConsentDialog
        isOpen={showConsent}
        prompt={prompt}
        onApprove={handleApproveGeneration}
        onCancel={handleCancelGeneration}
      />
    </div>
  );
}
