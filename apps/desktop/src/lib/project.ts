import {
  exists,
  mkdir,
  writeTextFile,
  readTextFile,
  readDir,
  remove,
} from '@tauri-apps/plugin-fs';
import { join, homeDir } from '@tauri-apps/api/path';

export interface Project {
  name: string;
  path: string;
  createdAt: string;
  lastOpened: string;
}

const PROJECT_TEMPLATE: Record<string, string> = {
  'CLAUDE.md': `# Guardrail Prototype Rules

You are generating UI components for a Guardrail prototype.

## Absolute Rules (Never Break These)

1. **Only import from \`@guardrail/ui\` and \`react\`**
   - ✅ \`import { Button, Card } from '@guardrail/ui'\`
   - ❌ \`import { Button } from '@shadcn/ui'\`
   - ❌ \`import styled from 'styled-components'\`

2. **Never use raw HTML elements**
   - ❌ \`<div>\`, \`<span>\`, \`<button>\`, \`<input>\`, \`<form>\`, \`<p>\`, \`<a>\`
   - ✅ \`<Box>\`, \`<Text>\`, \`<Button>\`, \`<Input>\`, \`<Flex>\`, \`<Link>\`

3. **Never use className or style props**
   - ❌ \`<Box className="p-4">\`
   - ❌ \`<Text style={{ color: 'red' }}>\`
   - ✅ \`<Box padding="md">\`, \`<Text color="error">\`

4. **Only use enumerated prop values**
   - ❌ \`<Box padding="17px">\` (arbitrary value)
   - ✅ \`<Box padding="md">\` (token value)

## Available Components

### Layer 2: Primitives
- \`Box\` - Container (padding, background, border, radius)
- \`Flex\` - Flexbox layout (direction, gap, align, justify)
- \`Grid\` - Grid layout (columns, gap)
- \`Text\` - Typography (size, weight, color)
- \`Spacer\` - Explicit spacing (size)

### Layer 3: Elements
- \`Button\` - variant: "primary" | "secondary" | "ghost" | "destructive"
- \`Input\` - label, placeholder, type
- \`Textarea\` - label, placeholder, rows
- \`Checkbox\` - label, checked
- \`Switch\` - label, checked
- \`Select\` - label, options, placeholder
- \`Badge\` - variant: "default" | "success" | "warning" | "error"
- \`Avatar\` - src, fallback, size
- \`Link\` - href, children
- \`Divider\` - orientation: "horizontal" | "vertical"

### Layer 4: Components
- \`Card\`, \`CardHeader\`, \`CardTitle\`, \`CardDescription\`, \`CardContent\`, \`CardFooter\`
- \`Modal\`, \`ModalTrigger\`, \`ModalContent\`, \`ModalFooter\`
- \`Tabs\`, \`TabsList\`, \`TabsTrigger\`, \`TabsContent\`
- \`Alert\` - variant: "default" | "success" | "warning" | "error"
- \`Tooltip\`, \`TooltipTrigger\`, \`TooltipContent\`

## Output Location

Always write the component to \`src/App.tsx\` with a default export.
`,

  'package.json': `{
  "name": "guardrail-prototype",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}`,

  'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  }
})`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}`,

  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@guardrail/ui/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}`,

  'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,

  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Guardrail Prototype</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,

  'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,

  'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,

  'src/App.tsx': `import { Box, Text, Button, Flex } from '@guardrail/ui'

export default function App() {
  return (
    <Box padding="lg" background="surface">
      <Flex direction="column" align="center" gap="md">
        <Text size="2xl" weight="bold">Welcome to Guardrail</Text>
        <Text color="muted">Start prototyping with your design system</Text>
        <Button variant="primary">Get Started</Button>
      </Flex>
    </Box>
  )
}`,
};

/**
 * Get the root directory for all Guardrail projects
 * ~/.guardrail/projects/
 */
export async function getProjectsRoot(): Promise<string> {
  const home = await homeDir();
  return join(home, '.guardrail', 'projects');
}

/**
 * Ensure the projects root directory exists
 */
export async function ensureProjectsRoot(): Promise<string> {
  const root = await getProjectsRoot();
  if (!(await exists(root))) {
    await mkdir(root, { recursive: true });
  }
  return root;
}

/**
 * List all projects in the centralized location
 */
export async function listAllProjects(): Promise<Project[]> {
  const root = await ensureProjectsRoot();

  try {
    const entries = await readDir(root);
    const projects: Project[] = [];

    for (const entry of entries) {
      // Only process directories
      if (entry.isDirectory && entry.name) {
        const projectPath = await join(root, entry.name);
        const claudeMdPath = await join(projectPath, 'CLAUDE.md');

        // Verify it's a valid Guardrail project
        if (await exists(claudeMdPath)) {
          // Try to read metadata if available
          let metadata: Partial<Project> = {};
          try {
            const metadataPath = await join(projectPath, '.guardrail-meta.json');
            if (await exists(metadataPath)) {
              const content = await readTextFile(metadataPath);
              metadata = JSON.parse(content);
            }
          } catch {
            // Ignore metadata errors
          }

          projects.push({
            name: entry.name,
            path: projectPath,
            createdAt: metadata.createdAt || new Date().toISOString(),
            lastOpened: metadata.lastOpened || new Date().toISOString(),
          });
        }
      }
    }

    // Sort by lastOpened (most recent first)
    projects.sort((a, b) =>
      new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
    );

    return projects;
  } catch {
    return [];
  }
}

/**
 * Create a new Guardrail project in the centralized location
 */
export async function createProject(name: string): Promise<Project> {
  const root = await ensureProjectsRoot();
  const projectPath = await join(root, name);

  // Check if directory exists
  if (await exists(projectPath)) {
    throw new Error(`Project "${name}" already exists at ${projectPath}`);
  }

  // Create project directory
  await mkdir(projectPath, { recursive: true });
  await mkdir(await join(projectPath, 'src'), { recursive: true });

  // Write template files
  for (const [filename, content] of Object.entries(PROJECT_TEMPLATE)) {
    const filePath = await join(projectPath, filename);

    // Ensure parent directory exists for nested files
    if (filename.includes('/')) {
      const parentDir = filename.split('/').slice(0, -1).join('/');
      await mkdir(await join(projectPath, parentDir), { recursive: true });
    }

    await writeTextFile(filePath, content);
  }

  const now = new Date().toISOString();
  const project: Project = {
    name,
    path: projectPath,
    createdAt: now,
    lastOpened: now,
  };

  // Save metadata
  await saveProjectMetadata(project);

  return project;
}

/**
 * Save project metadata to .guardrail-meta.json
 */
export async function saveProjectMetadata(project: Project): Promise<void> {
  const metadataPath = await join(project.path, '.guardrail-meta.json');
  await writeTextFile(metadataPath, JSON.stringify({
    createdAt: project.createdAt,
    lastOpened: project.lastOpened,
  }, null, 2));
}

/**
 * Open an existing project and update last opened time
 */
export async function openProject(projectPath: string): Promise<Project> {
  // Verify project exists
  if (!(await exists(projectPath))) {
    throw new Error(`Project not found at ${projectPath}`);
  }

  // Check for CLAUDE.md to verify it's a Guardrail project
  const claudeMdPath = await join(projectPath, 'CLAUDE.md');
  if (!(await exists(claudeMdPath))) {
    throw new Error('Not a valid Guardrail project (missing CLAUDE.md)');
  }

  const name = projectPath.split('/').pop() || 'Unknown';
  const now = new Date().toISOString();

  // Try to read existing metadata
  let createdAt = now;
  try {
    const metadataPath = await join(projectPath, '.guardrail-meta.json');
    if (await exists(metadataPath)) {
      const content = await readTextFile(metadataPath);
      const metadata = JSON.parse(content);
      createdAt = metadata.createdAt || now;
    }
  } catch {
    // Ignore metadata errors
  }

  const project: Project = {
    name,
    path: projectPath,
    createdAt,
    lastOpened: now,
  };

  // Update metadata with new lastOpened time
  await saveProjectMetadata(project);

  return project;
}

/**
 * Delete a project from the centralized location
 */
export async function deleteProject(projectPath: string): Promise<void> {
  // Verify project exists
  if (!(await exists(projectPath))) {
    throw new Error(`Project not found at ${projectPath}`);
  }

  // Only allow deleting projects from the centralized location
  const root = await getProjectsRoot();
  if (!projectPath.startsWith(root)) {
    throw new Error('Can only delete projects from the Guardrail projects folder');
  }

  // Remove the project directory
  await remove(projectPath, { recursive: true });
}

/**
 * Check if a project name is valid (no special characters, not too long)
 */
export function isValidProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name cannot be empty' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Project name is too long (max 50 characters)' };
  }

  // Only allow alphanumeric, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(name)) {
    return { valid: false, error: 'Project name can only contain letters, numbers, hyphens, and underscores' };
  }

  return { valid: true };
}
