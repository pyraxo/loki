import { type LLMProvider } from "@/types/settings";
import { type StoreState } from "../types";

// Canvas selectors
export const selectCanvasState = (state: StoreState) => ({
  nodes: state.nodes,
  edges: state.edges,
  viewport: state.viewport,
  hasUnsavedChanges: state.hasUnsavedChanges,
});

export const selectNodeById = (nodeId: string) => (state: StoreState) =>
  state.nodes.find((node) => node.id === nodeId);

export const selectTextNodeData = (nodeId: string) => (state: StoreState) => {
  const node = state.nodes.find((node) => node.id === nodeId);
  return node?.type === "textPrompt" ? node.data : null;
};

// Workflow selectors
export const selectWorkflowState = (state: StoreState) => ({
  isRunning: state.workflow.isRunning,
  currentNode: state.workflow.currentNode,
  completedNodes: state.workflow.completedNodes,
  errorNodes: state.workflow.errorNodes,
});

export const selectIsWorkflowRunning = (state: StoreState) => state.workflow.isRunning;

// Session selectors
export const selectActiveSession = (state: StoreState) => {
  const { activeSessionId, sessions } = state;
  return activeSessionId ? sessions[activeSessionId] : null;
};

export const selectSessionById = (sessionId: string) => (state: StoreState) =>
  state.sessions[sessionId];

export const selectFilteredSessions = (state: StoreState) => {
  const { sessions, filteredSessionIds } = state;
  return filteredSessionIds.map((id) => sessions[id]).filter(Boolean);
};

export const selectSessionLoadingState = (state: StoreState) => ({
  isLoading: state.isLoading,
  error: state.error,
});

// Settings selectors
export const selectSettings = (state: StoreState) => state.settings;

export const selectProviderSettings = (provider: LLMProvider) => (state: StoreState) =>
  state.settings.providers[provider];

export const selectTheme = (state: StoreState) => state.settings.theme;

// Dialog selectors
export const selectConfirmationDialog = (state: StoreState) => state.confirmationDialog;

export const selectRenameDialog = (state: StoreState) => state.renameDialog;

export const selectSettingsDialog = (state: StoreState) => state.settingsDialog;

// History selectors
export const selectTextHistory = (nodeId: string) => (state: StoreState) => {
  const node = state.nodes.find((node) => node.id === nodeId);
  if (node?.type === "textPrompt") {
    return node.data.history || { undoStack: [], redoStack: [] };
  }
  return { undoStack: [], redoStack: [] };
};

export const selectCanUndo = (nodeId: string) => (state: StoreState) => {
  const history = selectTextHistory(nodeId)(state);
  return history.undoStack.length > 0;
};

export const selectCanRedo = (nodeId: string) => (state: StoreState) => {
  const history = selectTextHistory(nodeId)(state);
  return history.redoStack.length > 0;
};

// Auto-save selectors
export const selectAutoSaveState = (state: StoreState) => ({
  autoSaveEnabled: state.autoSaveEnabled,
  hasUnsavedChanges: state.hasUnsavedChanges,
});

// Composite selectors
export const selectCanSave = (state: StoreState) => {
  const { activeSessionId, hasUnsavedChanges, isLoading } = state;
  return activeSessionId && hasUnsavedChanges && !isLoading;
};

export const selectSessionStatus = (sessionId: string) => (state: StoreState) => {
  const session = state.sessions[sessionId];
  return session ? session.metadata.status : null;
};

export const selectActiveSessionStatus = (state: StoreState) => {
  const { activeSessionId, sessions } = state;
  if (!activeSessionId) return null;
  const session = sessions[activeSessionId];
  return session ? session.metadata.status : null;
}; 