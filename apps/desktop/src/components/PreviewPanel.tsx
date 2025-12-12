import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import { ValidationErrors } from './ValidationErrors';
import {
  startPreviewServer,
  stopPreviewServer,
  checkDependencies,
  installDependencies,
  checkProjectExists,
} from '../lib/preview';
import { findComponentById } from '../lib/component-parser';
import { generateCSSVariables, DEFAULT_THEME } from '../lib/theme';

type PreviewStatus = 'idle' | 'installing' | 'starting' | 'running' | 'error';

// Selection message from iframe
interface SelectionMessage {
  type: 'guardrail-component-click' | 'guardrail-component-hover';
  componentName: string;
  path: string[]; // Path from root to clicked element
}

export function PreviewPanel() {
  const project = useAppStore((state) => state.project);
  const generatedCode = useAppStore((state) => state.generatedCode);
  const validationErrors = useAppStore((state) => state.validationErrors);
  const status = useAppStore((state) => state.status);
  const parsedComponents = useAppStore((state) => state.parsedComponents);
  const selectedComponentId = useAppStore((state) => state.selectedComponentId);
  const setSelectedComponent = useAppStore((state) => state.setSelectedComponent);
  const setHoveredComponent = useAppStore((state) => state.setHoveredComponent);
  const themes = useAppStore((state) => state.themes);
  const activeThemeId = useAppStore((state) => state.activeThemeId);

  // Get active theme
  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? DEFAULT_THEME;

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const setupInProgressRef = useRef(false);
  const lastProjectPathRef = useRef<string | null>(null);

  // Find component by name in the parsed tree
  const findComponentByName = useCallback(
    (name: string, path: string[]) => {
      // Walk through parsedComponents to find matching component
      function searchInTree(
        components: typeof parsedComponents,
        pathIndex: number
      ): string | null {
        for (const comp of components) {
          // Check if this component matches
          if (comp.name === name) {
            // If we've consumed the path or it's a direct match, return
            if (pathIndex >= path.length || path[pathIndex] === name) {
              return comp.id;
            }
          }
          // Check children
          if (comp.children.length > 0) {
            const found = searchInTree(comp.children, pathIndex);
            if (found) return found;
          }
        }
        return null;
      }

      return searchInTree(parsedComponents, 0);
    },
    [parsedComponents]
  );

  // Handle messages from the iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Verify origin (localhost)
      if (!event.origin.includes('localhost')) return;

      const data = event.data as SelectionMessage;
      if (!data || !data.type) return;

      if (data.type === 'guardrail-component-click') {
        const componentId = findComponentByName(data.componentName, data.path);
        if (componentId) {
          setSelectedComponent(componentId);
        }
      } else if (data.type === 'guardrail-component-hover') {
        const componentId = findComponentByName(data.componentName, data.path);
        setHoveredComponent(componentId);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [findComponentByName, setSelectedComponent, setHoveredComponent]);

  // Inject theme CSS into iframe
  const injectThemeCSS = useCallback(() => {
    if (!iframeRef.current?.contentDocument) return;

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      const themeCSS = generateCSSVariables(activeTheme);

      // Check if theme style already exists
      let styleEl = iframeDoc.getElementById('guardrail-theme-css') as HTMLStyleElement;
      if (!styleEl) {
        styleEl = iframeDoc.createElement('style');
        styleEl.id = 'guardrail-theme-css';
        iframeDoc.head.appendChild(styleEl);
      }

      styleEl.textContent = themeCSS;
      console.log('[PreviewPanel] Injected theme CSS for:', activeTheme.name);
    } catch (err) {
      console.error('[PreviewPanel] Failed to inject theme CSS:', err);
    }
  }, [activeTheme]);

  // Inject selection script into iframe when it loads
  const injectSelectionScript = useCallback(() => {
    if (!iframeRef.current?.contentWindow || !selectionMode) return;

    try {
      const script = `
        (function() {
          if (window.__guardrailSelectionActive) return;
          window.__guardrailSelectionActive = true;

          // Add selection styles
          const style = document.createElement('style');
          style.textContent = \`
            [data-guardrail-hover] {
              outline: 2px dashed #3b82f6 !important;
              outline-offset: 2px !important;
            }
            [data-guardrail-selected] {
              outline: 2px solid #3b82f6 !important;
              outline-offset: 2px !important;
            }
          \`;
          document.head.appendChild(style);

          // Get component name from element
          function getComponentName(el) {
            // React fiber stores component info
            const key = Object.keys(el).find(k => k.startsWith('__reactFiber'));
            if (key) {
              let fiber = el[key];
              while (fiber) {
                if (fiber.type && typeof fiber.type === 'function') {
                  return fiber.type.name || fiber.type.displayName;
                }
                if (fiber.type && typeof fiber.type === 'string') {
                  // Skip lowercase HTML elements
                  if (fiber.type[0] === fiber.type[0].toUpperCase()) {
                    return fiber.type;
                  }
                }
                fiber = fiber.return;
              }
            }
            return null;
          }

          // Build path from root
          function getComponentPath(el) {
            const path = [];
            let current = el;
            while (current && current !== document.body) {
              const name = getComponentName(current);
              if (name) path.unshift(name);
              current = current.parentElement;
            }
            return path;
          }

          // Handle click
          document.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const name = getComponentName(e.target);
            if (name) {
              window.parent.postMessage({
                type: 'guardrail-component-click',
                componentName: name,
                path: getComponentPath(e.target)
              }, '*');
            }
          }, true);

          // Handle hover
          let hoveredEl = null;
          document.addEventListener('mouseover', (e) => {
            if (hoveredEl) {
              hoveredEl.removeAttribute('data-guardrail-hover');
            }
            hoveredEl = e.target;
            const name = getComponentName(e.target);
            if (name) {
              e.target.setAttribute('data-guardrail-hover', 'true');
              window.parent.postMessage({
                type: 'guardrail-component-hover',
                componentName: name,
                path: getComponentPath(e.target)
              }, '*');
            }
          });

          document.addEventListener('mouseout', () => {
            if (hoveredEl) {
              hoveredEl.removeAttribute('data-guardrail-hover');
              hoveredEl = null;
            }
            window.parent.postMessage({
              type: 'guardrail-component-hover',
              componentName: '',
              path: []
            }, '*');
          });

          console.log('[Guardrail] Selection mode active');
        })();
      `;

      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return;

      // Create and inject script element
      const scriptEl = iframeDoc.createElement('script');
      scriptEl.textContent = script;
      iframeDoc.body.appendChild(scriptEl);
    } catch (err) {
      console.error('[PreviewPanel] Failed to inject selection script:', err);
    }
  }, [selectionMode]);

  // Start preview server when project is ready
  useEffect(() => {
    if (!project) return;

    // Capture project for use in async function
    const projectPath = project.path;

    // Skip if same project and setup already done or in progress
    if (lastProjectPathRef.current === projectPath && setupInProgressRef.current) {
      console.log('[PreviewPanel] Setup already in progress for:', projectPath);
      return;
    }

    // Skip if already running for this project
    if (lastProjectPathRef.current === projectPath && previewStatus === 'running') {
      console.log('[PreviewPanel] Server already running for:', projectPath);
      return;
    }

    let cancelled = false;

    async function setupPreview() {
      // Prevent concurrent setups
      if (setupInProgressRef.current) {
        console.log('[PreviewPanel] Setup already in progress, skipping');
        return;
      }

      setupInProgressRef.current = true;
      lastProjectPathRef.current = projectPath;

      try {
        // First check if project exists (with timeout for Tauri API initialization)
        console.log('[PreviewPanel] Checking if project exists:', projectPath);
        let projectExists = false;
        try {
          projectExists = await Promise.race([
            checkProjectExists(projectPath),
            new Promise<boolean>((_, reject) =>
              setTimeout(() => reject(new Error('Project check timeout')), 5000)
            )
          ]);
        } catch (checkErr) {
          console.warn('[PreviewPanel] Project check failed:', checkErr);
          // In browser mode or on error, assume project doesn't exist
          projectExists = false;
        }

        if (!projectExists) {
          console.log('[PreviewPanel] Project does not exist:', projectPath);
          setPreviewStatus('idle');
          setupInProgressRef.current = false;
          return;
        }

        // Check if dependencies are installed
        console.log('[PreviewPanel] Checking dependencies at:', projectPath);
        let hasDeps = false;
        try {
          hasDeps = await checkDependencies(projectPath);
        } catch (depsErr) {
          console.warn('[PreviewPanel] Dependencies check failed:', depsErr);
        }
        console.log('[PreviewPanel] Has dependencies:', hasDeps);

        if (!hasDeps) {
          setPreviewStatus('installing');
          console.log('[PreviewPanel] Installing dependencies...');
          try {
            await installDependencies(projectPath);
            console.log('[PreviewPanel] Dependencies installed');
          } catch (installErr) {
            console.error('[PreviewPanel] Install error:', installErr);
            // Try to continue anyway - deps might already be there
          }
        }

        if (cancelled) {
          setupInProgressRef.current = false;
          return;
        }

        // Start the preview server (will reuse if already running)
        setPreviewStatus('starting');
        console.log('[PreviewPanel] Starting dev server...');
        try {
          const url = await startPreviewServer(projectPath);
          if (!cancelled) {
            setPreviewUrl(url);
            setPreviewStatus('running');
            setPreviewError(null);
            console.log('[PreviewPanel] Server running at:', url);
          }
        } catch (startErr) {
          console.error('[PreviewPanel] Failed to start server:', startErr);
          // Fall back to default URL if server might already be running
          setPreviewUrl('http://localhost:5173');
          setPreviewStatus('running');
          setPreviewError('Server may need manual start. Run: cd ~/guardrail-prototype && npm run dev');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[PreviewPanel] Error:', err);
          // Still try to show preview with default URL
          setPreviewUrl('http://localhost:5173');
          setPreviewError(err instanceof Error ? err.message : String(err));
          setPreviewStatus('error');
        }
      } finally {
        setupInProgressRef.current = false;
      }
    }

    // Debounce the setup to prevent rapid restarts
    const timeoutId = setTimeout(setupPreview, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.path]); // Only depend on project path, not previewStatus

  // Refresh iframe when code changes and status is ready
  useEffect(() => {
    if (status === 'ready' && previewStatus === 'running') {
      // Small delay to let the file watcher pick up changes
      const timer = setTimeout(() => {
        setIframeKey((prev) => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [generatedCode, status, previewStatus]);

  // Re-inject theme CSS when theme changes
  useEffect(() => {
    if (previewStatus === 'running' && iframeRef.current) {
      // Small delay to ensure iframe is ready
      const timer = setTimeout(() => {
        injectThemeCSS();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTheme, previewStatus, injectThemeCSS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreviewServer();
    };
  }, []);

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const hasErrors = validationErrors.length > 0;
  const isReady = status === 'ready';

  const renderPreviewContent = () => {
    if (previewStatus === 'installing') {
      return (
        <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="font-medium">Installing dependencies...</p>
            <p className="text-xs mt-2">This may take a minute</p>
          </div>
        </div>
      );
    }

    if (previewStatus === 'starting') {
      return (
        <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="font-medium">Starting preview server...</p>
            <p className="text-xs mt-2">Waiting for Vite dev server</p>
          </div>
        </div>
      );
    }

    if (previewStatus === 'error') {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="font-medium text-amber-600 dark:text-amber-400">Preview Server Not Running</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">{previewError}</p>
            <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-left">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-2">To start the preview server:</p>
              <code className="text-xs text-primary-600 dark:text-primary-400 font-mono">
                cd ~/guardrail-prototype && npm run dev
              </code>
            </div>
            <p className="text-xs text-neutral-400 mt-3">
              The preview will auto-refresh when the server starts
            </p>
          </div>
        </div>
      );
    }

    if (isReady && previewUrl) {
      return (
        <div className="relative w-full h-full">
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={previewUrl}
            className={`w-full h-full border-0 ${selectionMode ? 'cursor-crosshair' : ''}`}
            title="Preview"
            onLoad={() => {
              injectThemeCSS();
              injectSelectionScript();
            }}
          />
          {selectionMode && (
            <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-md shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Click a component to select it
            </div>
          )}
          {selectedComponentId && !selectionMode && (
            <div className="absolute bottom-2 left-2 bg-neutral-900/80 text-white text-xs px-2 py-1 rounded-md">
              Selected: {findComponentById(parsedComponents, selectedComponentId)?.name || 'Unknown'}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
        <div className="text-center">
          <div className="text-4xl mb-4">🎨</div>
          <p className="font-medium">Enter a prompt to generate a component</p>
          {previewUrl ? (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs">Preview server ready at {previewUrl}</p>
            </div>
          ) : previewStatus === 'idle' ? (
            <p className="text-xs mt-2 text-neutral-400">Preview server will start automatically</p>
          ) : null}
        </div>
      </div>
    );
  };

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
            {previewStatus === 'running' && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-green-500 inline-block" />
            )}
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
        <div className="flex gap-2">
          {activeTab === 'preview' && previewStatus === 'running' && (
            <>
              <button
                onClick={() => setSelectionMode(!selectionMode)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectionMode
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
                }`}
                title="Click to select components in the preview"
              >
                {selectionMode ? '✓ Select Mode' : 'Select'}
              </button>
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400
                           hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors"
              >
                Refresh
              </button>
            </>
          )}
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {hasErrors ? (
          <ValidationErrors errors={validationErrors} />
        ) : activeTab === 'preview' ? (
          <div className="h-full">{renderPreviewContent()}</div>
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
