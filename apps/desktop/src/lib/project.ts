import {
  exists,
  mkdir,
  writeTextFile,
  readTextFile,
} from '@tauri-apps/plugin-fs';
import { join, appDataDir } from '@tauri-apps/api/path';

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
    "@guardrail/ui": "^0.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
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
 * Create a new Guardrail project
 */
export async function createProject(name: string, basePath: string): Promise<Project> {
  const projectPath = await join(basePath, name);

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

  return {
    name,
    path: projectPath,
    createdAt: now,
    lastOpened: now,
  };
}

/**
 * Get list of recent projects from app data
 */
export async function getRecentProjects(): Promise<Project[]> {
  const appData = await appDataDir();
  const projectsFile = await join(appData, 'guardrail', 'projects.json');

  try {
    if (await exists(projectsFile)) {
      const content = await readTextFile(projectsFile);
      return JSON.parse(content);
    }
  } catch {
    // Ignore errors, return empty array
  }

  return [];
}

/**
 * Save project to recent projects list
 */
export async function saveRecentProject(project: Project): Promise<void> {
  const appData = await appDataDir();
  const guardrailDir = await join(appData, 'guardrail');
  const projectsFile = await join(guardrailDir, 'projects.json');

  // Ensure directory exists
  if (!(await exists(guardrailDir))) {
    await mkdir(guardrailDir, { recursive: true });
  }

  // Get existing projects
  const projects = await getRecentProjects();

  // Update or add project
  const existingIndex = projects.findIndex((p) => p.path === project.path);
  if (existingIndex >= 0) {
    projects[existingIndex] = { ...project, lastOpened: new Date().toISOString() };
  } else {
    projects.unshift(project);
  }

  // Keep only last 10 projects
  const recentProjects = projects.slice(0, 10);

  await writeTextFile(projectsFile, JSON.stringify(recentProjects, null, 2));
}

/**
 * Open an existing project
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

  const project: Project = {
    name,
    path: projectPath,
    createdAt: now, // We don't have the original creation date
    lastOpened: now,
  };

  // Save to recent projects
  await saveRecentProject(project);

  return project;
}
