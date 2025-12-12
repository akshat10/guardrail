import '@testing-library/jest-dom';

// Mock Tauri APIs for testing
const mockTauriApis = {
  '@tauri-apps/plugin-shell': {
    Command: {
      create: vi.fn(() => ({
        execute: vi.fn().mockResolvedValue({ code: 0, stdout: '', stderr: '' }),
        spawn: vi.fn(),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      })),
    },
  },
  '@tauri-apps/plugin-fs': {
    exists: vi.fn().mockResolvedValue(true),
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeTextFile: vi.fn().mockResolvedValue(undefined),
    readTextFile: vi.fn().mockResolvedValue(''),
  },
  '@tauri-apps/api/path': {
    join: vi.fn((...parts: string[]) => Promise.resolve(parts.join('/'))),
    appDataDir: vi.fn().mockResolvedValue('/app-data'),
  },
};

vi.mock('@tauri-apps/plugin-shell', () => mockTauriApis['@tauri-apps/plugin-shell']);
vi.mock('@tauri-apps/plugin-fs', () => mockTauriApis['@tauri-apps/plugin-fs']);
vi.mock('@tauri-apps/api/path', () => mockTauriApis['@tauri-apps/api/path']);
