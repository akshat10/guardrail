import { Command, type Child } from '@tauri-apps/plugin-shell';
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

// Track active generation process for cancellation
let activeChild: Child | null = null;

// ============================================================================
// Stream Event Types (from Claude CLI --output-format stream-json)
// ============================================================================

export interface StreamEventDelta {
  type: string;
  text?: string;
}

export interface StreamEventData {
  type: string;
  index?: number;
  delta?: StreamEventDelta;
  name?: string;
  input?: unknown;
}

export interface StreamEvent {
  type: 'system' | 'stream_event' | 'assistant' | 'result';
  subtype?: 'init' | 'success' | 'error';
  event?: StreamEventData;
  message?: unknown;
  result?: string;
  error?: string;
}

// ============================================================================
// JSON Line Parser - handles chunks that may split across line boundaries
// ============================================================================

class JsonLineParser {
  private buffer = '';

  parse(chunk: string): StreamEvent[] {
    this.buffer += chunk;
    const events: StreamEvent[] = [];
    const lines = this.buffer.split('\n');

    // Keep the last (potentially incomplete) line in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const event = JSON.parse(trimmed) as StreamEvent;
        events.push(event);
      } catch {
        // Skip malformed JSON lines (may be partial or debug output)
        console.warn('[Stream] Failed to parse JSON line:', trimmed.slice(0, 100));
      }
    }

    return events;
  }

  flush(): StreamEvent[] {
    const remaining = this.buffer.trim();
    this.buffer = '';
    if (!remaining) return [];

    try {
      return [JSON.parse(remaining) as StreamEvent];
    } catch {
      return [];
    }
  }
}

// ============================================================================
// Cancellation Support
// ============================================================================

/**
 * Cancel the active generation process
 */
export function cancelGeneration(): void {
  if (activeChild) {
    activeChild.kill().catch(console.error);
    activeChild = null;
  }
}

/**
 * Check if a generation is currently running
 */
export function isGenerating(): boolean {
  return activeChild !== null;
}

// Dangerous operations to block (for future use with --disallowedTools)
const _BLOCKED_TOOLS = [
  'Bash(rm:*)',           // No deletions
  'Bash(sudo:*)',         // No privilege escalation
  'Bash(curl:*)',         // No arbitrary network calls
  'Bash(wget:*)',
  'Bash(chmod:*)',        // No permission changes
  'Bash(chown:*)',
  'Bash(mv:*)',           // No moving files outside project
  'Bash(git push:*)',     // No pushing
  'Bash(npm publish:*)',  // No publishing
];

// Export for future use
export const BLOCKED_TOOLS = _BLOCKED_TOOLS;

// Permission mode for Claude Code execution
export type PermissionMode = 'restricted' | 'permissive';

// Current permission mode (default to restricted)
let permissionMode: PermissionMode = 'restricted';

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
  onTextDelta?: (text: string) => void;  // Called for each streamed text token
  onInit?: () => void;                    // Called when stream initializes
  onToolUse?: (tool: string, input: unknown) => void;  // Called when Claude uses a tool
  useRestrictions?: boolean;              // Use --disallowedTools to block dangerous operations
}

/**
 * Set the permission mode for Claude Code execution
 */
export function setPermissionMode(mode: PermissionMode): void {
  permissionMode = mode;
}

/**
 * Get current permission mode
 */
export function getPermissionMode(): PermissionMode {
  return permissionMode;
}

export interface GenerateResult {
  success: boolean;
  code: string;
  error?: string;
  cancelled?: boolean;
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
 * Generate a prototype using Claude Code CLI with real-time streaming
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, projectPath, onTextDelta, onInit, onToolUse, useRestrictions = true } = options;

  // Cancel any existing generation
  cancelGeneration();

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

    // Escape prompt for shell
    const escapedPrompt = fullPrompt.replace(/'/g, "'\\''");

    // Use script to create a pseudo-TTY so Claude streams output instead of buffering
    const shellCmd = `script -q /dev/null claude --print --output-format stream-json --verbose --include-partial-messages --dangerously-skip-permissions '${escapedPrompt}'`;

    console.log('[Claude] Creating shell command');

    // Use zsh login shell like preview.ts does
    const command = Command.create('zsh', ['-l', '-c', `cd '${projectPath}' && ${shellCmd}`], {
      encoding: 'utf-8',
    });

    const parser = new JsonLineParser();
    let streamError = '';

    // Set up stdout listener BEFORE spawn
    command.stdout.on('data', (line) => {
      console.log('[Claude] stdout line:', line.substring(0, 100));

      const events = parser.parse(line);
      for (const event of events) {
        if (event.type === 'system' && event.subtype === 'init') {
          onInit?.();
        } else if (event.type === 'stream_event' && event.event) {
          if (event.event.type === 'content_block_delta' && event.event.delta?.text) {
            onTextDelta?.(event.event.delta.text);
          } else if (event.event.type === 'tool_use' && event.event.name) {
            onToolUse?.(event.event.name, event.event.input);
          }
        } else if (event.type === 'result' && event.subtype === 'error') {
          streamError = event.error || event.result || 'Unknown error';
        }
      }
    });

    command.stderr.on('data', (line) => {
      console.log('[Claude] stderr:', line);
    });

    command.on('close', (data) => {
      console.log('[Claude] close event, code:', data.code);
    });

    command.on('error', (error) => {
      console.log('[Claude] error event:', error);
    });

    console.log('[Claude] Spawning...');
    activeChild = await command.spawn();
    console.log('[Claude] Spawned, pid:', activeChild.pid);

    // Wait for completion
    return new Promise((resolve) => {
      command.on('close', async (payload) => {
        activeChild = null;

        // Flush remaining buffered content
        const remaining = parser.flush();
        for (const event of remaining) {
          if (event.type === 'stream_event' && event.event?.delta?.text) {
            onTextDelta?.(event.event.delta.text);
          }
        }

        if (payload.code !== 0 || streamError) {
          resolve({
            success: false,
            code: '',
            error: streamError || `Exit code ${payload.code}`,
          });
          return;
        }

        try {
          const outputPath = `${projectPath}/src/App.tsx`;
          const code = await readTextFile(outputPath);
          resolve({ success: true, code });
        } catch (err) {
          resolve({
            success: false,
            code: '',
            error: `Failed to read output: ${err}`,
          });
        }
      });
    });
  } catch (error) {
    activeChild = null;
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
