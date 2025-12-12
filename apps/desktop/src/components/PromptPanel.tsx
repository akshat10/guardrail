import React from 'react';
import { useAppStore } from '../stores/app-store';
import { useClaudeCode } from '../hooks/useClaudeCode';

export function PromptPanel() {
  const prompt = useAppStore((state) => state.prompt);
  const setPrompt = useAppStore((state) => state.setPrompt);
  const status = useAppStore((state) => state.status);
  const streamingOutput = useAppStore((state) => state.streamingOutput);
  const { generateCode } = useClaudeCode();

  const isGenerating = status === 'generating' || status === 'validating' || status === 'fixing';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    await generateCode(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating) {
        generateCode(prompt);
      }
    }
  };

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

      {/* Streaming Output */}
      {streamingOutput && (
        <div className="flex-1 overflow-auto p-4 bg-neutral-50 dark:bg-neutral-900">
          <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Claude Output
          </h3>
          <pre className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono">
            {streamingOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
