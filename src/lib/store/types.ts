import { type BaseNodeData, type CustomNode, type WorkflowState } from "@/types/nodes";
import { type Session, type SessionMetadata } from "@/types/sessions";
import { type AppSettings, type LLMProvider, type ProviderSettings, type ThemeMode } from "@/types/settings";
import { type Edge, type Viewport } from "@xyflow/react";

// Canvas slice types
export interface CanvasSlice {
  nodes: CustomNode[];
  edges: Edge[];
  viewport: Viewport;
  hasUnsavedChanges: boolean;

  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setViewport: (viewport: Viewport) => void;
  setNodesInternal: (nodes: CustomNode[]) => void;
  setEdgesInternal: (edges: Edge[]) => void;
  setViewportInternal: (viewport: Viewport) => void;
  updateNodeData: (nodeId: string, data: Partial<BaseNodeData & Record<string, any>>) => void;
  updateNodeDataDuringExecution: (nodeId: string, data: Partial<BaseNodeData & Record<string, any>>) => void;
  updateNodeStatus: (nodeId: string, status: "idle" | "running" | "success" | "error", error?: string) => void;
}

// Workflow slice types
export interface WorkflowSlice {
  workflow: WorkflowState;

  startWorkflow: () => void;
  stopWorkflow: () => void;
  markNodeCompleted: (nodeId: string) => void;
  markNodeError: (nodeId: string, error: string) => void;
  resetWorkflow: () => void;
  checkWorkflowCompletion: () => void;
}

// Session slice types
export interface SessionSlice {
  sessions: Record<string, Session>;
  activeSessionId: string | null;
  searchQuery: string;
  filteredSessionIds: string[];
  isLoading: boolean;
  error: string | null;

  createSession: (name?: string) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  saveSession: (sessionId?: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  duplicateSession: (sessionId: string) => Promise<string>;
  renameSession: (sessionId: string, newName: string) => Promise<void>;
  setActiveSession: (sessionId: string) => void;
  updateSessionMetadata: (sessionId: string, metadata: Partial<SessionMetadata>, updateTimestamp?: boolean) => void;
  markSessionAsUnsaved: (sessionId?: string) => void;
  markSessionAsRunning: (sessionId?: string) => void;
  markSessionAsError: (sessionId: string, error: string) => void;
  markSessionAsCompleted: (sessionId: string) => void;
  setSearchQuery: (query: string) => void;
  filterSessions: () => void;
  refreshSessions: () => Promise<void>;
  exportSession: (sessionId: string) => Promise<string | null>;
  importSession: (sessionData: string) => Promise<string | null>;
  exportAllSessions: () => Promise<string>;
}

// Settings slice types
export interface SettingsSlice {
  settings: AppSettings;
  settingsLoaded: boolean;

  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateProviderSettings: (provider: LLMProvider, settings: Partial<ProviderSettings>) => Promise<void>;
  setApiKey: (provider: LLMProvider, apiKey: string) => Promise<void>;
  getApiKey: (provider: LLMProvider) => Promise<string | null>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  initializeTheme: () => Promise<void>;
  exportSettings: () => Promise<string>;
  importSettings: (data: string) => Promise<void>;
  resetSettings: () => Promise<void>;
}

// Dialog slice types
export interface DialogSlice {
  confirmationDialog: {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: (() => void) | null;
  };
  renameDialog: {
    isOpen: boolean;
    title: string;
    currentValue: string;
    onConfirm: ((newName: string) => void) | null;
  };
  settingsDialog: {
    isOpen: boolean;
    activeTab: string;
  };

  showConfirmationDialog: (title: string, description: string, onConfirm: () => void, confirmText?: string) => void;
  hideConfirmationDialog: () => void;
  showRenameDialog: (title: string, currentValue: string, onConfirm: (newName: string) => void) => void;
  hideRenameDialog: () => void;
  openSettingsDialog: (tab?: string) => void;
  closeSettingsDialog: () => void;
  toggleSettingsDialog: () => void;
}

// History slice types
export interface HistorySlice {
  addTextHistoryEntry: (nodeId: string, text: string) => void;
  undoTextChange: (nodeId: string) => boolean;
  redoTextChange: (nodeId: string) => boolean;
  captureTextHistoryAtSavePoint: () => void;
}

// Auto-save slice types
export interface AutoSaveSlice {
  autoSaveEnabled: boolean;

  enableAutoSave: () => void;
  disableAutoSave: () => void;
  triggerAutoSave: () => Promise<void>;
}

// Combined store type
export type StoreState = CanvasSlice & WorkflowSlice & SessionSlice & SettingsSlice & DialogSlice & HistorySlice & AutoSaveSlice & {
  initializeStore: () => Promise<void>;
}; 