import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/app-store';
import { useProject } from '../hooks/useProject';
import { getRecentProjects, type Project } from '../lib/project';

export function ProjectSelector() {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStatus = useAppStore((state) => state.setStatus);
  const { create, open } = useProject();

  useEffect(() => {
    loadRecentProjects();
  }, []);

  const loadRecentProjects = async () => {
    try {
      const projects = await getRecentProjects();
      setRecentProjects(projects);
    } catch (err) {
      console.error('Failed to load recent projects:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !projectPath.trim()) return;

    setError(null);
    setIsCreating(true);

    try {
      await create(newProjectName.trim(), projectPath.trim());
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenProject = async (projectPath: string) => {
    setError(null);
    try {
      await open(projectPath);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open project');
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
            Welcome to Guardrail
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            AI-assisted prototyping with design system enforcement
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Create New Project */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
              Create New Project
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label
                  htmlFor="projectName"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="my-prototype"
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700
                             bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="projectPath"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Location
                </label>
                <input
                  id="projectPath"
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="/Users/you/projects"
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700
                             bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                type="submit"
                disabled={!newProjectName.trim() || !projectPath.trim() || isCreating}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md
                           hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>

          {/* Recent Projects */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
              Recent Projects
            </h2>
            {recentProjects.length > 0 ? (
              <div className="space-y-2">
                {recentProjects.map((project) => (
                  <button
                    key={project.path}
                    onClick={() => handleOpenProject(project.path)}
                    className="w-full p-3 text-left rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <div className="font-medium text-neutral-900 dark:text-neutral-50">
                      {project.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {project.path}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                No recent projects
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
