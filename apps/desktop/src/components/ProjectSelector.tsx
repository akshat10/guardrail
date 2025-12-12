import { useState, useEffect, type FormEvent } from 'react';
import { useAppStore } from '../stores/app-store';
import { useProject } from '../hooks/useProject';
import {
  listAllProjects,
  deleteProject,
  isValidProjectName,
  type Project,
} from '../lib/project';

export function ProjectSelector() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const setStatus = useAppStore((state) => state.setStatus);
  const { create, open } = useProject();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const allProjects = await listAllProjects();
      setProjects(allProjects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();

    const name = newProjectName.trim();
    const validation = isValidProjectName(name);

    if (!validation.valid) {
      setError(validation.error || 'Invalid project name');
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      await create(name);
      setStatus('idle');
      setShowCreateForm(false);
      setNewProjectName('');
    } catch (err) {
      console.error('[ProjectSelector] Error creating project:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
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

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingPath(project.path);
    try {
      await deleteProject(project.path);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeletingPath(null);
    }
  };

  // Filter projects by search query
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format relative time
  const formatRelativeTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Guardrail Projects
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          AI-assisted prototyping with design system enforcement
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full px-4 py-2 pl-10 rounded-lg border border-neutral-300 dark:border-neutral-700
                       bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg
                     hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500
                     flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Create Project Form (Overlay) */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-md p-6 rounded-xl bg-white dark:bg-neutral-900 shadow-xl">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
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
                  onChange={(e) => {
                    setNewProjectName(e.target.value);
                    setError(null);
                  }}
                  placeholder="my-prototype"
                  autoFocus
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700
                             bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Letters, numbers, hyphens, and underscores only
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewProjectName('');
                    setError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300
                             hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim() || isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md
                             hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="flex-1 overflow-auto">
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredProjects.map((project) => (
              <div
                key={project.path}
                className="group p-4 rounded-lg border border-neutral-200 dark:border-neutral-800
                           bg-white dark:bg-neutral-950 hover:border-primary-500 dark:hover:border-primary-500
                           transition-colors cursor-pointer"
                onClick={() => handleOpenProject(project.path)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-50 truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Last opened {formatRelativeTime(project.lastOpened)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project);
                      }}
                      disabled={deletingPath === project.path}
                      className="p-2 text-neutral-400 hover:text-red-500 rounded-md
                                 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Delete project"
                    >
                      {deletingPath === project.path ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800
                           flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-1">
              No projects yet
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              Create your first project to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg
                         hover:bg-primary-700"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">
              No projects matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && !showCreateForm && (
        <div className="mt-4 p-4 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-xs text-neutral-400 text-center">
          Projects are stored in ~/.guardrail/projects/
        </p>
      </div>
    </div>
  );
}
