import { create } from 'zustand';
import { classifyTool, matchesPermissionPattern, type ToolCategory } from '../lib/permission-utils';

export interface PermissionRequest {
  id: string;              // tool_use_id from Claude Code
  toolName: string;        // "Write", "Bash", "Edit", etc.
  toolInput: {
    file_path?: string;
    content?: string;
    command?: string;
    [key: string]: unknown;
  };
  category: ToolCategory;
  timestamp: number;
  status: 'pending' | 'approved' | 'denied';
  approvedBy?: 'user' | 'session_rule';
}

export interface SessionPermission {
  id: string;
  toolName: string;        // "Write", "Bash", "*"
  pathPattern?: string;    // Glob pattern: "src/**/*.tsx"
  commandPattern?: string; // For bash: "git *", "npm test"
  projectPath: string;
  grantedAt: number;
}

interface PermissionState {
  // Current pending requests
  pendingRequests: PermissionRequest[];

  // Session permissions (cleared on project change or app close)
  sessionPermissions: SessionPermission[];

  // Settings
  autoApproveReadOps: boolean;

  // Actions
  addRequest: (request: Omit<PermissionRequest, 'status' | 'category' | 'timestamp'>) => PermissionRequest;
  resolveRequest: (id: string, decision: 'approved' | 'denied') => void;
  addSessionPermission: (permission: Omit<SessionPermission, 'id' | 'grantedAt'>) => void;
  checkSessionPermission: (toolName: string, toolInput: Record<string, unknown>, projectPath: string) => boolean;
  clearSessionPermissions: () => void;
  clearPendingRequests: () => void;
  setAutoApproveReadOps: (value: boolean) => void;

  // Computed getters
  getCurrentRequest: () => PermissionRequest | null;
  hasPendingRequest: () => boolean;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  pendingRequests: [],
  sessionPermissions: [],
  autoApproveReadOps: true,

  addRequest: (request) => {
    const category = classifyTool(request.toolName, request.toolInput);
    const fullRequest: PermissionRequest = {
      ...request,
      category,
      timestamp: Date.now(),
      status: 'pending',
    };

    set((state) => ({
      pendingRequests: [...state.pendingRequests, fullRequest],
    }));

    return fullRequest;
  },

  resolveRequest: (id, decision) => {
    set((state) => ({
      pendingRequests: state.pendingRequests.map((r) =>
        r.id === id ? { ...r, status: decision, approvedBy: 'user' as const } : r
      ),
    }));
  },

  addSessionPermission: (permission) => {
    const fullPermission: SessionPermission = {
      ...permission,
      id: crypto.randomUUID(),
      grantedAt: Date.now(),
    };
    set((state) => ({
      sessionPermissions: [...state.sessionPermissions, fullPermission],
    }));
  },

  checkSessionPermission: (toolName, toolInput, projectPath) => {
    const permissions = get().sessionPermissions;
    const autoApproveRead = get().autoApproveReadOps;

    // Auto-approve read operations if enabled
    const category = classifyTool(toolName, toolInput);
    if (autoApproveRead && category === 'file_read') {
      return true;
    }

    // Check session permissions
    return permissions.some((perm) => {
      // Must be same project
      if (perm.projectPath !== projectPath) {
        return false;
      }

      return matchesPermissionPattern(perm, toolName, toolInput);
    });
  },

  clearSessionPermissions: () => {
    set({ sessionPermissions: [] });
  },

  clearPendingRequests: () => {
    set({ pendingRequests: [] });
  },

  setAutoApproveReadOps: (value) => {
    set({ autoApproveReadOps: value });
  },

  getCurrentRequest: () => {
    const pending = get().pendingRequests.filter(r => r.status === 'pending');
    return pending[0] || null;
  },

  hasPendingRequest: () => {
    return get().pendingRequests.some(r => r.status === 'pending');
  },
}));
