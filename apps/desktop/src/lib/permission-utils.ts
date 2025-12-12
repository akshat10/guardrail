export type ToolCategory =
  | 'file_read'
  | 'file_write'
  | 'file_delete'
  | 'shell_safe'
  | 'shell_unsafe'
  | 'network';

export interface PermissionPattern {
  toolName: string;
  pathPattern?: string;
  commandPattern?: string;
}

/**
 * Classify a tool into a risk category
 */
export function classifyTool(toolName: string, input: Record<string, unknown>): ToolCategory {
  switch (toolName) {
    case 'Read':
    case 'Glob':
    case 'Grep':
    case 'LS':
      return 'file_read';

    case 'Write':
    case 'Edit':
    case 'MultiEdit':
      return 'file_write';

    case 'Bash': {
      const command = String(input.command || '');

      // Delete commands
      if (/^rm\s/.test(command) || /\brm\b/.test(command)) {
        return 'file_delete';
      }

      // Safe read-only commands
      if (/^(git\s+(log|status|diff|branch|show)|npm\s+(test|run)|pnpm\s+(test|run)|yarn\s+(test|run)|ls|pwd|cat|head|tail|echo|which|type)/.test(command)) {
        return 'shell_safe';
      }

      return 'shell_unsafe';
    }

    case 'WebFetch':
    case 'WebSearch':
      return 'network';

    default:
      return 'shell_unsafe';
  }
}

/**
 * Get icon for a tool category
 */
export function getCategoryIcon(category: ToolCategory): string {
  const icons: Record<ToolCategory, string> = {
    file_read: 'eye',
    file_write: 'pencil',
    file_delete: 'trash-2',
    shell_safe: 'terminal',
    shell_unsafe: 'alert-triangle',
    network: 'globe',
  };
  return icons[category];
}

/**
 * Get emoji icon for a tool category
 */
export function getCategoryEmoji(category: ToolCategory): string {
  const icons: Record<ToolCategory, string> = {
    file_read: '👁️',
    file_write: '📝',
    file_delete: '🗑️',
    shell_safe: '💻',
    shell_unsafe: '⚠️',
    network: '🌐',
  };
  return icons[category];
}

/**
 * Get human-readable label for a tool category
 */
export function getCategoryLabel(category: ToolCategory): string {
  const labels: Record<ToolCategory, string> = {
    file_read: 'Read File',
    file_write: 'Write File',
    file_delete: 'Delete File',
    shell_safe: 'Run Command',
    shell_unsafe: 'Run Command',
    network: 'Network Request',
  };
  return labels[category];
}

/**
 * Get risk level for a tool category
 */
export function getRiskLevel(category: ToolCategory): 'low' | 'medium' | 'high' {
  const risks: Record<ToolCategory, 'low' | 'medium' | 'high'> = {
    file_read: 'low',
    file_write: 'medium',
    file_delete: 'high',
    shell_safe: 'low',
    shell_unsafe: 'high',
    network: 'medium',
  };
  return risks[category];
}

/**
 * Get risk color for a tool category
 */
export function getRiskColor(category: ToolCategory): string {
  const risk = getRiskLevel(category);
  switch (risk) {
    case 'low':
      return 'text-green-600 dark:text-green-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'high':
      return 'text-red-600 dark:text-red-400';
  }
}

/**
 * Simple glob pattern matching
 */
function matchGlob(pattern: string, path: string): boolean {
  // Convert glob to regex
  const regex = new RegExp(
    '^' +
    pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*\*/g, '{{GLOBSTAR}}')      // Temp replace **
      .replace(/\*/g, '[^/]*')               // * matches anything except /
      .replace(/{{GLOBSTAR}}/g, '.*')        // ** matches everything
      .replace(/\?/g, '.')                   // ? matches single char
    + '$'
  );
  return regex.test(path);
}

/**
 * Simple command pattern matching
 */
function matchCommandPattern(pattern: string, command: string): boolean {
  // Convert pattern to regex
  const regex = new RegExp(
    '^' +
    pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
    + '$'
  );
  return regex.test(command);
}

/**
 * Check if a permission pattern matches a tool request
 */
export function matchesPermissionPattern(
  pattern: PermissionPattern,
  toolName: string,
  toolInput: Record<string, unknown>
): boolean {
  // Check tool name
  if (pattern.toolName !== '*' && pattern.toolName !== toolName) {
    return false;
  }

  // Check path pattern if applicable
  if (pattern.pathPattern && toolInput.file_path) {
    if (!matchGlob(pattern.pathPattern, String(toolInput.file_path))) {
      return false;
    }
  }

  // Check command pattern for Bash
  if (pattern.commandPattern && toolInput.command) {
    if (!matchCommandPattern(pattern.commandPattern, String(toolInput.command))) {
      return false;
    }
  }

  return true;
}

/**
 * Create a session permission pattern from a tool request
 */
export function createPatternFromRequest(
  toolName: string,
  toolInput: Record<string, unknown>,
  scope: 'tool' | 'path' | 'command'
): PermissionPattern {
  const pattern: PermissionPattern = { toolName };

  if (scope === 'path' && toolInput.file_path) {
    // Create a pattern for the directory
    const path = String(toolInput.file_path);
    const dir = path.substring(0, path.lastIndexOf('/'));
    pattern.pathPattern = dir ? `${dir}/**` : '**';
  }

  if (scope === 'command' && toolInput.command) {
    // Create a pattern for the command prefix
    const cmd = String(toolInput.command);
    const prefix = cmd.split(' ')[0];
    pattern.commandPattern = `${prefix} *`;
  }

  return pattern;
}

/**
 * Format tool input for display
 */
export function formatToolInput(_toolName: string, toolInput: Record<string, unknown>): string {
  if (toolInput.file_path) {
    return String(toolInput.file_path);
  }
  if (toolInput.command) {
    return String(toolInput.command);
  }
  if (toolInput.url) {
    return String(toolInput.url);
  }
  return JSON.stringify(toolInput).slice(0, 100);
}

/**
 * Get preview content for a permission request
 */
export function getPreviewContent(toolInput: Record<string, unknown>): string | null {
  if (toolInput.content) {
    const content = String(toolInput.content);
    // Limit preview to first 500 chars
    return content.length > 500 ? content.slice(0, 500) + '...' : content;
  }
  return null;
}
