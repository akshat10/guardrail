import { create } from 'zustand';
import type { ValidationError } from '../lib/validator';
import type { Project } from '../lib/project';
import type { ParsedComponent } from '../lib/component-parser';
import type { Theme } from '../lib/theme';
import { DEFAULT_THEME } from '../lib/theme';
import { usePermissionStore } from './permission-store';

export type AppStatus =
  | 'initializing' // Checking for Claude Code
  | 'no-claude-code' // Claude Code not found
  | 'no-project' // Ready but no project open
  | 'idle' // Project open, waiting for input
  | 'generating' // Claude Code is generating
  | 'validating' // Checking output
  | 'fixing' // Asking Claude to fix errors
  | 'ready' // Valid output ready
  | 'error'; // Something went wrong

export type ViewMode = 'workspace' | 'gallery';

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: string;
  success: boolean;
}

interface AppState {
  // Status
  status: AppStatus;
  setStatus: (status: AppStatus) => void;

  // View Mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Project
  project: Project | null;
  setProject: (project: Project | null) => void;

  // Generation
  prompt: string;
  setPrompt: (prompt: string) => void;

  generatedCode: string;
  setGeneratedCode: (code: string) => void;

  streamingOutput: string;
  setStreamingOutput: (output: string) => void;
  appendStreamingOutput: (chunk: string) => void;
  clearStreamingOutput: () => void;

  // Streaming progress
  isStreamStarted: boolean;
  setStreamStarted: (started: boolean) => void;

  // Validation
  validationErrors: ValidationError[];
  setValidationErrors: (errors: ValidationError[]) => void;

  fixAttempts: number;
  incrementFixAttempts: () => void;
  resetFixAttempts: () => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Prompt History
  promptHistory: PromptHistoryItem[];
  addToHistory: (prompt: string, success: boolean) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;

  // Component Selection (for visual prop editor)
  parsedComponents: ParsedComponent[];
  setParsedComponents: (components: ParsedComponent[]) => void;

  selectedComponentId: string | null;
  setSelectedComponent: (id: string | null) => void;

  hoveredComponentId: string | null;
  setHoveredComponent: (id: string | null) => void;

  // Theme System
  themes: Theme[];
  activeThemeId: string | null;
  setThemes: (themes: Theme[]) => void;
  setActiveTheme: (id: string) => void;
  updateTheme: (id: string, updates: Partial<Theme>) => void;

  // Actions
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Status
  status: 'initializing',
  setStatus: (status) => set({ status }),

  // View Mode
  viewMode: 'workspace',
  setViewMode: (mode) => set({ viewMode: mode }),

  // Project
  project: null,
  setProject: (project) => {
    // Clear session permissions when project changes
    usePermissionStore.getState().clearSessionPermissions();
    set({ project });
  },

  // Generation
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),

  generatedCode: '',
  setGeneratedCode: (code) => set({ generatedCode: code }),

  streamingOutput: '',
  setStreamingOutput: (output) => set({ streamingOutput: output }),
  appendStreamingOutput: (chunk) =>
    set((state) => ({
      streamingOutput: state.streamingOutput + chunk,
    })),
  clearStreamingOutput: () => set({ streamingOutput: '' }),

  // Streaming progress
  isStreamStarted: false,
  setStreamStarted: (started) => set({ isStreamStarted: started }),

  // Validation
  validationErrors: [],
  setValidationErrors: (errors) => set({ validationErrors: errors }),

  fixAttempts: 0,
  incrementFixAttempts: () =>
    set((state) => ({ fixAttempts: state.fixAttempts + 1 })),
  resetFixAttempts: () => set({ fixAttempts: 0 }),

  // Error
  error: null,
  setError: (error) => set({ error }),

  // Prompt History
  promptHistory: [],
  addToHistory: (prompt, success) =>
    set((state) => ({
      promptHistory: [
        {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          prompt,
          timestamp: new Date().toISOString(),
          success,
        },
        ...state.promptHistory,
      ].slice(0, 50), // Keep last 50 prompts
    })),
  removeFromHistory: (id) =>
    set((state) => ({
      promptHistory: state.promptHistory.filter((item) => item.id !== id),
    })),
  clearHistory: () => set({ promptHistory: [] }),

  // Component Selection (for visual prop editor)
  parsedComponents: [],
  setParsedComponents: (components) => set({ parsedComponents: components }),

  selectedComponentId: null,
  setSelectedComponent: (id) => set({ selectedComponentId: id }),

  hoveredComponentId: null,
  setHoveredComponent: (id) => set({ hoveredComponentId: id }),

  // Theme System
  themes: [DEFAULT_THEME],
  activeThemeId: 'default',
  setThemes: (themes) => set({ themes }),
  setActiveTheme: (id) => set({ activeThemeId: id }),
  updateTheme: (id, updates) =>
    set((state) => ({
      themes: state.themes.map((theme) =>
        theme.id === id ? { ...theme, ...updates } : theme
      ),
    })),

  // Actions
  reset: () => {
    // Clear permissions on reset
    usePermissionStore.getState().clearSessionPermissions();
    usePermissionStore.getState().clearPendingRequests();
    set({
      prompt: '',
      generatedCode: '',
      streamingOutput: '',
      isStreamStarted: false,
      validationErrors: [],
      fixAttempts: 0,
      error: null,
      status: 'idle',
      viewMode: 'workspace',
      // Clear selection state
      parsedComponents: [],
      selectedComponentId: null,
      hoveredComponentId: null,
      // Reset themes to default
      themes: [DEFAULT_THEME],
      activeThemeId: 'default',
    });
  },
}));
