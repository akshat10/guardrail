import { Command, Child } from '@tauri-apps/plugin-shell';

export interface PreviewServer {
  process: Child | null;
  url: string | null;
  isRunning: boolean;
}

let currentServer: PreviewServer = {
  process: null,
  url: null,
  isRunning: false,
};

/**
 * Start the Vite preview server for a project
 */
export async function startPreviewServer(projectPath: string): Promise<string> {
  // Stop any existing server
  await stopPreviewServer();

  try {
    const command = Command.create('pnpm', ['dev'], {
      cwd: projectPath,
      encoding: 'utf-8',
    });

    let resolveUrl: (url: string) => void;
    const urlPromise = new Promise<string>((resolve) => {
      resolveUrl = resolve;
    });

    // Listen for the Vite URL in stdout
    command.stdout.on('data', (data) => {
      const match = data.match(/Local:\s+(http:\/\/localhost:\d+)/);
      if (match) {
        currentServer.url = match[1];
        resolveUrl(match[1]);
      }
    });

    command.stderr.on('data', (data) => {
      console.error('[Preview Server]', data);
    });

    // Spawn the process
    const child = await command.spawn();
    currentServer.process = child;
    currentServer.isRunning = true;

    // Wait for the URL with a timeout
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('Preview server startup timeout')), 30000);
    });

    const url = await Promise.race([urlPromise, timeoutPromise]);
    return url;
  } catch (error) {
    currentServer.isRunning = false;
    throw error;
  }
}

/**
 * Stop the preview server
 */
export async function stopPreviewServer(): Promise<void> {
  if (currentServer.process) {
    try {
      await currentServer.process.kill();
    } catch {
      // Process might already be dead
    }
  }

  currentServer = {
    process: null,
    url: null,
    isRunning: false,
  };
}

/**
 * Get the current preview server status
 */
export function getPreviewStatus(): PreviewServer {
  return { ...currentServer };
}

/**
 * Check if the preview server is running
 */
export function isPreviewRunning(): boolean {
  return currentServer.isRunning;
}

/**
 * Get the preview URL
 */
export function getPreviewUrl(): string | null {
  return currentServer.url;
}

/**
 * Install project dependencies
 */
export async function installDependencies(projectPath: string): Promise<void> {
  const command = Command.create('pnpm', ['install'], {
    cwd: projectPath,
    encoding: 'utf-8',
  });

  const result = await command.execute();

  if (result.code !== 0) {
    throw new Error(`Failed to install dependencies: ${result.stderr}`);
  }
}

/**
 * Check if dependencies are installed
 */
export async function checkDependencies(projectPath: string): Promise<boolean> {
  try {
    const { exists } = await import('@tauri-apps/plugin-fs');
    const { join } = await import('@tauri-apps/api/path');
    const nodeModulesPath = await join(projectPath, 'node_modules');
    return await exists(nodeModulesPath);
  } catch {
    return false;
  }
}
