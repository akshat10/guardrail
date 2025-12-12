import { useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import { createProject, openProject, saveRecentProject } from '../lib/project';

export function useProject() {
  const setProject = useAppStore((state) => state.setProject);
  const setStatus = useAppStore((state) => state.setStatus);
  const setError = useAppStore((state) => state.setError);
  const reset = useAppStore((state) => state.reset);

  const create = useCallback(
    async (name: string, basePath: string) => {
      try {
        const project = await createProject(name, basePath);
        await saveRecentProject(project);
        setProject(project);
        reset();
        setStatus('idle');
        return project;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create project');
        throw err;
      }
    },
    [setProject, setStatus, setError, reset]
  );

  const open = useCallback(
    async (projectPath: string) => {
      try {
        const project = await openProject(projectPath);
        setProject(project);
        reset();
        setStatus('idle');
        return project;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to open project');
        throw err;
      }
    },
    [setProject, setStatus, setError, reset]
  );

  const close = useCallback(() => {
    setProject(null);
    reset();
    setStatus('no-project');
  }, [setProject, reset, setStatus]);

  return { create, open, close };
}
