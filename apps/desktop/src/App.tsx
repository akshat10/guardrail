import React, { useEffect } from 'react';
import { useAppStore } from './stores/app-store';
import { detectClaudeCode } from './lib/claude-code';
import { Layout } from './components/Layout';
import { PromptPanel } from './components/PromptPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ProjectSelector } from './components/ProjectSelector';
import { ClaudeCodeRequired } from './components/ClaudeCodeRequired';

function App() {
  const status = useAppStore((state) => state.status);
  const project = useAppStore((state) => state.project);
  const setStatus = useAppStore((state) => state.setStatus);

  useEffect(() => {
    // Check for Claude Code on startup
    async function checkClaudeCode() {
      const hasClaudeCode = await detectClaudeCode();
      if (hasClaudeCode) {
        setStatus('no-project');
      } else {
        setStatus('no-claude-code');
      }
    }
    checkClaudeCode();
  }, [setStatus]);

  // Show Claude Code required screen
  if (status === 'no-claude-code') {
    return <ClaudeCodeRequired />;
  }

  // Show loading state
  if (status === 'initializing') {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">Initializing Guardrail...</p>
        </div>
      </div>
    );
  }

  // Show project selector if no project is open
  if (!project || status === 'no-project') {
    return <ProjectSelector />;
  }

  // Main app with project open
  return (
    <Layout>
      <div className="h-full flex">
        <div className="w-1/2 border-r border-neutral-200 dark:border-neutral-800">
          <PromptPanel />
        </div>
        <div className="w-1/2">
          <PreviewPanel />
        </div>
      </div>
    </Layout>
  );
}

export default App;
