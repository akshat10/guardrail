import React, { useState } from 'react';
import { useAppStore } from '../stores/app-store';
import { ValidationErrors } from './ValidationErrors';

export function PreviewPanel() {
  const generatedCode = useAppStore((state) => state.generatedCode);
  const validationErrors = useAppStore((state) => state.validationErrors);
  const status = useAppStore((state) => state.status);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasErrors = validationErrors.length > 0;
  const isReady = status === 'ready';

  return (
    <div className="h-full flex flex-col border-l border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'preview'
                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'code'
                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
            }`}
          >
            Code
          </button>
        </div>
        {generatedCode && (
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400
                       hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {hasErrors ? (
          <ValidationErrors errors={validationErrors} />
        ) : activeTab === 'preview' ? (
          <div className="h-full">
            {isReady && generatedCode ? (
              <iframe
                src="http://localhost:5173"
                className="w-full h-full border-0"
                title="Preview"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎨</div>
                  <p>Enter a prompt to generate a component</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            {generatedCode ? (
              <pre className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg overflow-auto">
                {generatedCode}
              </pre>
            ) : (
              <div className="text-center text-neutral-500 dark:text-neutral-400 py-12">
                No code generated yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
