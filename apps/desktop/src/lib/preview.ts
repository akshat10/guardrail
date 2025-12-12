import { Command, Child } from '@tauri-apps/plugin-shell';

const DEFAULT_PORT = 5173;

export interface PreviewServer {
  process: Child | null;
  url: string | null;
  isRunning: boolean;
  projectPath: string | null;
}

let currentServer: PreviewServer = {
  process: null,
  url: null,
  isRunning: false,
  projectPath: null,
};

/**
 * Check if a port is available by trying to connect to it
 */
async function isPortAvailable(port: number): Promise<boolean> {
  try {
    const command = Command.create('zsh', [
      '-c',
      `lsof -i :${port} -t 2>/dev/null | head -1`,
    ]);
    const result = await command.execute();
    // If lsof returns nothing, port is available
    return result.stdout.trim() === '';
  } catch {
    // If command fails, assume port is available
    return true;
  }
}

/**
 * Wait for a port to become available
 */
async function waitForPortRelease(
  port: number,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 200;

  while (Date.now() - startTime < timeout) {
    if (await isPortAvailable(port)) {
      console.log(`[Preview] Port ${port} is now available`);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  console.warn(`[Preview] Timeout waiting for port ${port} to be released`);
  return false;
}

/**
 * Create a shell command that runs npm with proper PATH
 * Uses a login shell to source the user's profile (nvm, etc.)
 */
function createShellNpmCommand(
  npmArgs: string[],
  options: { cwd: string; encoding: string }
): ReturnType<typeof Command.create> {
  // Use zsh (default on macOS) or bash with -l for login shell
  // -c to run a command
  // The login shell will source ~/.zshrc or ~/.bashrc which sets up nvm
  const npmCommand = `npm ${npmArgs.join(' ')}`;
  console.log(`[Preview] Creating shell command: ${npmCommand} in ${options.cwd}`);

  // Try zsh first (default on modern macOS), then bash
  try {
    return Command.create('zsh', ['-l', '-c', `cd "${options.cwd}" && ${npmCommand}`], {
      encoding: options.encoding,
    });
  } catch {
    console.log('[Preview] zsh not available, trying bash');
    return Command.create('bash', ['-l', '-c', `cd "${options.cwd}" && ${npmCommand}`], {
      encoding: options.encoding,
    });
  }
}

/**
 * Start the Vite preview server for a project
 */
export async function startPreviewServer(projectPath: string): Promise<string> {
  // If already running for this project, return existing URL
  if (currentServer.isRunning && currentServer.projectPath === projectPath && currentServer.url) {
    console.log('[Preview] Server already running for this project, reusing:', currentServer.url);
    return currentServer.url;
  }

  // If running for a different project, stop it first
  if (currentServer.isRunning) {
    console.log('[Preview] Stopping server for different project');
    await stopPreviewServer();
  }

  // Check if port is available (another process might be using it)
  const portAvailable = await isPortAvailable(DEFAULT_PORT);
  if (!portAvailable) {
    console.log('[Preview] Port is in use, waiting for release...');
    const released = await waitForPortRelease(DEFAULT_PORT, 5000);
    if (!released) {
      // Try to use existing server if it's on our expected port
      const existingUrl = `http://localhost:${DEFAULT_PORT}`;
      console.log('[Preview] Port still in use, attempting to reuse:', existingUrl);
      currentServer.url = existingUrl;
      currentServer.isRunning = true;
      currentServer.projectPath = projectPath;
      return existingUrl;
    }
  }

  try {
    // Use shell command to run npm with proper PATH (nvm support)
    const command = createShellNpmCommand(['run', 'dev'], {
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
        currentServer.projectPath = projectPath;
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
    currentServer.projectPath = projectPath;

    // Wait for the URL with a timeout
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('Preview server startup timeout')), 30000);
    });

    const url = await Promise.race([urlPromise, timeoutPromise]);
    return url;
  } catch (error) {
    currentServer.isRunning = false;
    currentServer.projectPath = null;
    throw error;
  }
}

/**
 * Stop the preview server
 */
export async function stopPreviewServer(): Promise<void> {
  if (currentServer.process) {
    try {
      console.log('[Preview] Stopping server...');
      await currentServer.process.kill();
      // Wait for the port to be released
      await waitForPortRelease(DEFAULT_PORT, 3000);
    } catch {
      // Process might already be dead
      console.log('[Preview] Process already stopped');
    }
  }

  currentServer = {
    process: null,
    url: null,
    isRunning: false,
    projectPath: null,
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
 * Install project dependencies and link @guardrail/ui
 */
export async function installDependencies(projectPath: string): Promise<void> {
  // Use shell command to run npm install with proper PATH (nvm support)
  const installCommand = createShellNpmCommand(['install'], {
    cwd: projectPath,
    encoding: 'utf-8',
  });

  console.log('[Preview] Running npm install...');
  const installResult = await installCommand.execute();

  if (installResult.code !== 0) {
    console.error('[Preview] npm install failed:', installResult.stderr);
    throw new Error(`Failed to install dependencies: ${installResult.stderr}`);
  }

  console.log('[Preview] npm install completed successfully');

  // Link @guardrail/ui from the monorepo
  // The Guardrail app runs from the monorepo, so we can link the local package
  await linkGuardrailUI(projectPath);
}

/**
 * Link @guardrail/ui package from the monorepo to the project
 */
async function linkGuardrailUI(projectPath: string): Promise<void> {
  const { exists, mkdir, copyFile, readDir } = await import('@tauri-apps/plugin-fs');
  const { join } = await import('@tauri-apps/api/path');

  // In development, use the monorepo package
  // Try to find the UI package relative to the app
  const possiblePaths = [
    // From monorepo root during development
    '/Users/akshat.mishra/Documents/Work/guardrail/packages/ui',
    // Could add more paths for production builds
  ];

  let uiPackagePath: string | null = null;
  for (const p of possiblePaths) {
    const pkgJson = await join(p, 'package.json');
    if (await exists(pkgJson)) {
      uiPackagePath = p;
      break;
    }
  }

  if (!uiPackagePath) {
    console.warn('[Preview] @guardrail/ui package not found, skipping link');
    return;
  }

  // Create @guardrail directory in node_modules
  const nodeModulesPath = await join(projectPath, 'node_modules');
  const guardrailPath = await join(nodeModulesPath, '@guardrail');
  const targetPath = await join(guardrailPath, 'ui');

  if (!(await exists(guardrailPath))) {
    await mkdir(guardrailPath, { recursive: true });
  }

  // Copy the UI package dist and package.json
  const distSource = await join(uiPackagePath, 'dist');
  const distTarget = await join(targetPath, 'dist');

  if (!(await exists(targetPath))) {
    await mkdir(targetPath, { recursive: true });
  }

  if (!(await exists(distTarget))) {
    await mkdir(distTarget, { recursive: true });
  }

  // Copy dist files
  try {
    const distFiles = await readDir(distSource);
    for (const file of distFiles) {
      if (file.name) {
        const sourcePath = await join(distSource, file.name);
        const targetFilePath = await join(distTarget, file.name);
        await copyFile(sourcePath, targetFilePath);
      }
    }

    // Copy package.json
    const pkgSource = await join(uiPackagePath, 'package.json');
    const pkgTarget = await join(targetPath, 'package.json');
    await copyFile(pkgSource, pkgTarget);

    console.log('[Preview] Linked @guardrail/ui package');
  } catch (err) {
    console.error('[Preview] Error linking @guardrail/ui:', err);
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

/**
 * Check if a project path exists and has a package.json
 */
export async function checkProjectExists(projectPath: string): Promise<boolean> {
  try {
    const { exists } = await import('@tauri-apps/plugin-fs');
    const { join } = await import('@tauri-apps/api/path');

    // Check if the directory exists
    if (!(await exists(projectPath))) {
      return false;
    }

    // Check if package.json exists
    const pkgJsonPath = await join(projectPath, 'package.json');
    return await exists(pkgJsonPath);
  } catch {
    return false;
  }
}
