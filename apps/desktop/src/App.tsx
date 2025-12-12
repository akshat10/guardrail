import { useEffect, useState } from 'react';
import { useAppStore } from './stores/app-store';
import { detectClaudeCode } from './lib/claude-code';
import { Layout } from './components/Layout';
import { PromptPanel } from './components/PromptPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ProjectSelector } from './components/ProjectSelector';
import { ClaudeCodeRequired } from './components/ClaudeCodeRequired';
import { ComponentGallery } from './components/gallery';
import { Terminal } from './components/Terminal';
import { createProject } from './lib/project';
import { homeDir, join } from '@tauri-apps/api/path';
import { exists } from '@tauri-apps/plugin-fs';

type InputMode = 'prompt' | 'terminal';

function App() {
  const status = useAppStore((state) => state.status);
  const project = useAppStore((state) => state.project);
  const viewMode = useAppStore((state) => state.viewMode);
  const setStatus = useAppStore((state) => state.setStatus);
  const setProject = useAppStore((state) => state.setProject);

  const [inputMode, setInputMode] = useState<InputMode>('terminal');

  useEffect(() => {
    // Check for Claude Code on startup and auto-create default project
    async function initializeApp() {
      // In browser mode (non-Tauri), use mock project for testing
      const isBrowser = !window.__TAURI_INTERNALS__;
      if (isBrowser) {
        // Set a mock project for browser testing
        setProject({
          name: 'Browser Preview',
          path: '/mock/project',
          createdAt: new Date().toISOString(),
          lastOpened: new Date().toISOString(),
        });
        setStatus('idle');
        return;
      }

      // Check for Claude Code
      const hasClaudeCode = await detectClaudeCode();
      if (!hasClaudeCode) {
        setStatus('no-claude-code');
        return;
      }

      // Auto-create default project in home directory
      try {
        const home = await homeDir();
        console.log('[Guardrail] Home directory:', home);
        const defaultProjectPath = await join(home, 'guardrail-prototype');
        console.log('[Guardrail] Default project path:', defaultProjectPath);
        const claudeMdPath = await join(defaultProjectPath, 'CLAUDE.md');

        // Check if default project already exists
        const projectExists = await exists(claudeMdPath);
        console.log('[Guardrail] Project exists:', projectExists);

        if (projectExists) {
          // Open existing project
          const now = new Date().toISOString();
          setProject({
            name: 'guardrail-prototype',
            path: defaultProjectPath,
            createdAt: now,
            lastOpened: now,
          });
        } else {
          // Create new default project
          console.log('[Guardrail] Creating new project...');
          const newProject = await createProject('guardrail-prototype', home);
          console.log('[Guardrail] Project created:', newProject);
          setProject(newProject);
        }
        setStatus('idle');
      } catch (err) {
        console.error('[Guardrail] Failed to create default project:', err);
        // Show more detailed error info
        if (err instanceof Error) {
          console.error('[Guardrail] Error details:', err.message, err.stack);
        }
        setStatus('no-project');
      }
    }
    initializeApp();
  }, [setStatus, setProject]);

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
      {viewMode === 'workspace' ? (
        <div className="h-full flex flex-col">
          {/* Mode toggle */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Input:</span>
            <button
              onClick={() => setInputMode('prompt')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                inputMode === 'prompt'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              Simple Prompt
            </button>
            <button
              onClick={() => setInputMode('terminal')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                inputMode === 'terminal'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              Claude Terminal
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 flex min-h-0">
            <div className="w-1/2 border-r border-neutral-200 dark:border-neutral-800">
              {inputMode === 'prompt' ? (
                <PromptPanel />
              ) : (
                <Terminal projectPath={project.path} />
              )}
            </div>
            <div className="w-1/2">
              <PreviewPanel />
            </div>
          </div>
        </div>
      ) : (
        <ComponentGallery />
      )}
    </Layout>
  );
}

export default App;
