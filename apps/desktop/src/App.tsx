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
import { ComponentTree } from './components/ComponentTree';
import { PropEditor } from './components/PropEditor';
import { ThemeEditor } from './components/ThemeEditor';
import { createProject } from './lib/project';
import { findComponentById } from './lib/component-parser';
import { loadThemes } from './lib/theme';
import { homeDir, join } from '@tauri-apps/api/path';
import { exists } from '@tauri-apps/plugin-fs';

type InputMode = 'prompt' | 'terminal';
type RightPanelMode = 'props' | 'theme';

function App() {
  const status = useAppStore((state) => state.status);
  const project = useAppStore((state) => state.project);
  const viewMode = useAppStore((state) => state.viewMode);
  const setStatus = useAppStore((state) => state.setStatus);
  const setProject = useAppStore((state) => state.setProject);
  const setThemes = useAppStore((state) => state.setThemes);
  const selectedComponentId = useAppStore((state) => state.selectedComponentId);
  const parsedComponents = useAppStore((state) => state.parsedComponents);
  const generatedCode = useAppStore((state) => state.generatedCode);

  const [inputMode, setInputMode] = useState<InputMode>('terminal');
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('props');
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Find selected component
  const selectedComponent = selectedComponentId
    ? findComponentById(parsedComponents, selectedComponentId)
    : null;

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
        // Set mock generated code to test the prop editor
        useAppStore.getState().setGeneratedCode(`import { Box, Flex, Text, Card, CardHeader, CardTitle, CardContent, Button } from '@guardrail/ui'

export default function App() {
  return (
    <Box padding="lg" background="surface">
      <Card>
        <CardHeader>
          <CardTitle>Welcome Card</CardTitle>
        </CardHeader>
        <CardContent>
          <Flex direction="column" gap="md">
            <Text size="base" color="muted">
              This is a sample component for testing the visual prop editor.
            </Text>
            <Button variant="primary" size="md">
              Click Me
            </Button>
          </Flex>
        </CardContent>
      </Card>
    </Box>
  )
}`);
        setStatus('ready');
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
          const newProject = await createProject('guardrail-prototype');
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

  // Load themes when project is opened
  useEffect(() => {
    if (!project) return;

    async function loadProjectThemes() {
      try {
        const themes = await loadThemes(project!.path);
        setThemes(themes);
        console.log('[App] Loaded themes:', themes.length);
      } catch (err) {
        console.error('[App] Failed to load themes:', err);
      }
    }

    loadProjectThemes();
  }, [project, setThemes]);

  // Show right panel when component is selected
  useEffect(() => {
    if (selectedComponentId) {
      setShowRightPanel(true);
      setRightPanelMode('props');
    }
  }, [selectedComponentId]);

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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Theme toggle */}
            <button
              onClick={() => {
                setShowRightPanel(true);
                setRightPanelMode('theme');
              }}
              className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                showRightPanel && rightPanelMode === 'theme'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Theme
            </button>
          </div>

          {/* Main content - 3 column layout */}
          <div className="flex-1 flex min-h-0">
            {/* Left: Input + Component Tree */}
            <div className="w-1/3 flex flex-col border-r border-neutral-200 dark:border-neutral-800">
              {/* Input area */}
              <div className="flex-1 min-h-0">
                {inputMode === 'prompt' ? (
                  <PromptPanel />
                ) : (
                  <Terminal projectPath={project.path} />
                )}
              </div>
              {/* Component Tree - collapsible */}
              {generatedCode && (
                <div className="h-48 border-t border-neutral-200 dark:border-neutral-800 overflow-auto bg-white dark:bg-neutral-950">
                  <ComponentTree />
                </div>
              )}
            </div>

            {/* Center: Preview */}
            <div className="flex-1">
              <PreviewPanel />
            </div>

            {/* Right: Prop Editor / Theme Editor Panel */}
            {(showRightPanel || selectedComponent) && (
              <div className="w-72 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col">
                {/* Panel tabs */}
                <div className="flex items-center gap-1 px-2 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                  <button
                    onClick={() => setRightPanelMode('props')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      rightPanelMode === 'props'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    Props
                  </button>
                  <button
                    onClick={() => setRightPanelMode('theme')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      rightPanelMode === 'theme'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    Theme
                  </button>
                  <button
                    onClick={() => setShowRightPanel(false)}
                    className="ml-auto p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    title="Close panel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Panel content */}
                <div className="flex-1 overflow-auto">
                  {rightPanelMode === 'props' ? (
                    selectedComponent ? (
                      <PropEditor
                        selectedComponent={selectedComponent}
                        onPropChange={() => {
                          // Trigger preview refresh after prop change
                        }}
                      />
                    ) : (
                      <div className="p-4 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                        <p>No component selected</p>
                        <p className="text-xs mt-1">Click a component in the preview to edit its props</p>
                      </div>
                    )
                  ) : (
                    <ThemeEditor />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ComponentGallery />
      )}
    </Layout>
  );
}

export default App;
