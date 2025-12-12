import { Command } from '@tauri-apps/plugin-shell';
import { readTextFile } from '@tauri-apps/plugin-fs';

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
    const command = Command.create('claude', ['--version']);
    const result = await command.execute();
    return result.code === 0;
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
    const command = Command.create('claude', [
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
