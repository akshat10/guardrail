export function ClaudeCodeRequired() {
  return (
    <div className="h-screen flex items-center justify-center p-8 bg-white dark:bg-neutral-950">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">🤖</div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">
          Claude Code Required
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">
          Guardrail requires Claude Code CLI to generate components. Please install Claude Code
          to continue.
        </p>

        <div className="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 mb-6">
          <p className="text-sm font-mono text-neutral-700 dark:text-neutral-300 mb-2">
            Install Claude Code:
          </p>
          <code className="text-sm bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-900 dark:text-neutral-50">
            npm install -g @anthropic-ai/claude-code
          </code>
        </div>

        <div className="space-y-4">
          <a
            href="https://docs.anthropic.com/claude-code"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-md
                       hover:bg-primary-700 transition-colors"
          >
            View Documentation
          </a>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            After installing, restart Guardrail to detect Claude Code.
          </p>
        </div>
      </div>
    </div>
  );
}
