import { useState, useCallback, useEffect } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { useAppStore } from '../stores/app-store';

export function usePreview() {
  const [isRunning, setIsRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const project = useAppStore((state) => state.project);

  const startPreview = useCallback(async () => {
    if (!project || isRunning) return;

    try {
      // Start the Vite dev server
      const command = Command.create('pnpm', ['dev'], {
        cwd: project.path,
        encoding: 'utf-8',
      });

      command.stdout.on('data', (data) => {
        // Look for the Vite URL in the output
        const match = data.match(/Local:\s+(http:\/\/localhost:\d+)/);
        if (match) {
          setPreviewUrl(match[1]);
        }
      });

      await command.spawn();
      setIsRunning(true);
    } catch (err) {
      console.error('Failed to start preview:', err);
    }
  }, [project, isRunning]);

  const stopPreview = useCallback(async () => {
    // Note: In a real implementation, we'd need to track and kill the spawned process
    setIsRunning(false);
    setPreviewUrl(null);
  }, []);

  // Auto-start preview when project changes
  useEffect(() => {
    if (project && !isRunning) {
      startPreview();
    }
    return () => {
      stopPreview();
    };
  }, [project?.path]);

  return {
    isRunning,
    previewUrl,
    startPreview,
    stopPreview,
  };
}
