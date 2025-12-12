import { Command } from '@tauri-apps/plugin-shell';
import { readTextFile } from '@tauri-apps/plugin-fs';

// Scope names defined in capabilities/default.json for claude CLI
// These correspond to different installation paths
const CLAUDE_SCOPE_NAMES = [
  'claude-local',    // ~/.local/bin/claude
  'claude-npm',      // ~/.npm-global/bin/claude
  'claude-homebrew', // /opt/homebrew/bin/claude
  'claude-usr-local', // /usr/local/bin/claude
  'claude',          // Default PATH lookup (fallback)
];

// Cache the working scope name
let cachedClaudeScope: string | null = null;

/**
 * Find a working claude scope by trying each one
 */
async function findClaudeScope(): Promise<string | null> {
  // Return cached scope if already found
  if (cachedClaudeScope) return cachedClaudeScope;

  for (const scopeName of CLAUDE_SCOPE_NAMES) {
    try {
      const command = Command.create(scopeName, ['--version']);
      const result = await command.execute();
      if (result.code === 0) {
        cachedClaudeScope = scopeName;
        return scopeName;
      }
    } catch {
      // This scope didn't work, try the next one
      continue;
    }
  }

  return null;
}

export interface GenerateOptions {
  prompt: string;
  projectPath: string;
  onChunk?: (chunk: string) => void;
}

export interface GenerateResult {
  success: boolean;
  code: string;
  error?: string;
}

/**
 * Check if Claude Code CLI is installed and accessible
 */
export async function detectClaudeCode(): Promise<boolean> {
  try {
    const claudeScope = await findClaudeScope();
    return claudeScope !== null;
  } catch {
    return false;
  }
}

/**
 * Generate a prototype using Claude Code CLI
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, projectPath, onChunk } = options;

  const fullPrompt = `
Create a React component based on this request:

${prompt}

IMPORTANT:
- Follow all rules in CLAUDE.md exactly
- Write the component to src/App.tsx
- Use ONLY imports from @guardrail/ui
- Do NOT use any raw HTML elements (div, span, button, etc.)
- Do NOT use className or style props
- Export the component as default

Generate the component now.
`.trim();

  try {
    const claudeScope = await findClaudeScope();
    if (!claudeScope) {
      return {
        success: false,
        code: '',
        error: 'Claude Code CLI not found. Please install it first.',
      };
    }

    const command = Command.create(claudeScope, [
      '--print',
      '--dangerously-skip-permissions',
      fullPrompt,
    ], {
      cwd: projectPath,
      encoding: 'utf-8',
    });

    // Stream output if callback provided
    if (onChunk) {
      command.stdout.on('data', (data) => {
        onChunk(data);
      });
    }

    const result = await command.execute();

    if (result.code !== 0) {
      return {
        success: false,
        code: '',
        error: result.stderr || 'Claude Code exited with an error',
      };
    }

    // Read the generated file
    const outputPath = `${projectPath}/src/App.tsx`;
    const code = await readTextFile(outputPath);

    return { success: true, code };
  } catch (error) {
    return {
      success: false,
      code: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Ask Claude Code to fix validation errors
 */
export async function fixViolations(
  projectPath: string,
  violations: string[]
): Promise<GenerateResult> {
  const fixPrompt = `
Fix the following violations in src/App.tsx:

${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}

Remember:
- Only use imports from @guardrail/ui
- No raw HTML elements (use Box, Text, Flex instead)
- No className or style props

Apply the fixes now.
`.trim();

  return generate({ prompt: fixPrompt, projectPath });
}
