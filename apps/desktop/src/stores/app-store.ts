import { create } from 'zustand';
import type { ValidationError } from '../lib/validator';
import type { Project } from '../lib/project';

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

interface AppState {
  // Status
  status: AppStatus;
  setStatus: (status: AppStatus) => void;

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

  // Validation
  validationErrors: ValidationError[];
  setValidationErrors: (errors: ValidationError[]) => void;

  fixAttempts: number;
  incrementFixAttempts: () => void;
  resetFixAttempts: () => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Actions
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Status
  status: 'initializing',
  setStatus: (status) => set({ status }),

  // Project
  project: null,
  setProject: (project) => set({ project }),

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

  // Actions
  reset: () =>
    set({
      prompt: '',
      generatedCode: '',
      streamingOutput: '',
      validationErrors: [],
      fixAttempts: 0,
      error: null,
      status: 'idle',
    }),
}));
