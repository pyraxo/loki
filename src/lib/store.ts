import { initialEdges, initialNodes } from "@/components/nodes/defaults";
import {
  type BaseNodeData,
  type CustomNode,
  type TextPromptNodeData,
  type WorkflowState
} from "@/types/nodes";
import {
  type Session,
  type SessionMetadata,
  SessionStatus,
} from "@/types/sessions";
import {
  type AppSettings,
  type LLMProvider,
  type ProviderSettings,
  type ThemeMode,
  createDefaultSettings,
} from "@/types/settings";
import { type Edge } from "@xyflow/react";
import { create } from "zustand";
import { sessionService } from "./session-service";
import { settingsService } from "./settings-service";

interface CanvasState {
  // React Flow state
  nodes: CustomNode[];
  edges: Edge[];

  // Workflow execution state
  workflow: WorkflowState;

  // Session management state
  sessions: Record<string, Session>;
  activeSessionId: string | null;
  searchQuery: string;
  filteredSessionIds: string[];
  isLoading: boolean;
  error: string | null;
  autoSaveEnabled: boolean;
  hasUnsavedChanges: boolean;

  // Confirmation dialog state
  confirmationDialog: {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: (() => void) | null;
  };

  // Rename dialog state
  renameDialog: {
    isOpen: boolean;
    title: string;
    currentValue: string;
    onConfirm: ((newName: string) => void) | null;
  };

  // Settings state
  settings: AppSettings;
  settingsLoaded: boolean;

  // Settings dialog state
  settingsDialog: {
    isOpen: boolean;
    activeTab: string;
  };

  // Canvas actions
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setNodesInternal: (nodes: CustomNode[]) => void; // For React Flow internal changes
  setEdgesInternal: (edges: Edge[]) => void; // For React Flow internal changes
  updateNodeData: (
    nodeId: string,
    data: Partial<BaseNodeData & Record<string, any>>
  ) => void;
  updateNodeDataDuringExecution: (
    nodeId: string,
    data: Partial<BaseNodeData & Record<string, any>>
  ) => void; // For execution updates that shouldn't mark as unsaved
  updateNodeStatus: (
    nodeId: string,
    status: "idle" | "running" | "success" | "error",
    error?: string
  ) => void;

  // Text node history management (save points only)
  undoTextChange: (nodeId: string) => boolean;
  redoTextChange: (nodeId: string) => boolean;
  captureTextHistoryAtSavePoint: () => void;

  // Workflow actions
  startWorkflow: () => void;
  stopWorkflow: () => void;
  markNodeCompleted: (nodeId: string) => void;
  markNodeError: (nodeId: string, error: string) => void;
  resetWorkflow: () => void;

  // Session operations
  createSession: (name?: string) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  saveSession: (sessionId?: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  duplicateSession: (sessionId: string) => Promise<string>;
  renameSession: (sessionId: string, newName: string) => Promise<void>;

  // Session management
  setActiveSession: (sessionId: string) => void;
  updateSessionMetadata: (
    sessionId: string,
    metadata: Partial<SessionMetadata>,
    updateTimestamp?: boolean
  ) => void;
  markSessionAsUnsaved: (sessionId?: string) => void;
  markSessionAsRunning: (sessionId?: string) => void;
  markSessionAsError: (sessionId: string, error: string) => void;
  markSessionAsCompleted: (sessionId: string) => void;

  // Search and filtering
  setSearchQuery: (query: string) => void;
  filterSessions: () => void;
  refreshSessions: () => Promise<void>;

  // Export/Import
  exportSession: (sessionId: string) => Promise<string | null>;
  importSession: (sessionData: string) => Promise<string | null>;
  exportAllSessions: () => Promise<string>;

  // Auto-save
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  triggerAutoSave: () => Promise<void>;

  // Confirmation dialog
  showConfirmationDialog: (
    title: string,
    description: string,
    onConfirm: () => void,
    confirmText?: string
  ) => void;
  hideConfirmationDialog: () => void;

  // Rename dialog
  showRenameDialog: (
    title: string,
    currentValue: string,
    onConfirm: (newName: string) => void
  ) => void;
  hideRenameDialog: () => void;

  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateProviderSettings: (
    provider: LLMProvider,
    settings: Partial<ProviderSettings>
  ) => Promise<void>;
  setApiKey: (provider: LLMProvider, apiKey: string) => Promise<void>;
  getApiKey: (provider: LLMProvider) => Promise<string | null>;

  // Theme actions
  setTheme: (theme: ThemeMode) => Promise<void>;
  initializeTheme: () => Promise<void>;

  // Settings dialog actions
  openSettingsDialog: (tab?: string) => void;
  closeSettingsDialog: () => void;
  toggleSettingsDialog: () => void;

  // Settings export/import
  exportSettings: () => Promise<string>;
  importSettings: (data: string) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Initialization
  initializeStore: () => Promise<void>;

  // Helper methods
  checkWorkflowCompletion: () => void;
}

export const useStore = create<CanvasState>((set, get) => ({
  // Initial canvas state
  nodes: [],
  edges: [],
  workflow: {
    isRunning: false,
    currentNode: undefined,
    completedNodes: [],
    errorNodes: [],
  },

  // Initial session state
  sessions: {},
  activeSessionId: null,
  searchQuery: "",
  filteredSessionIds: [],
  isLoading: false,
  error: null,
  autoSaveEnabled: true,
  hasUnsavedChanges: false,

  // Initial confirmation dialog state
  confirmationDialog: {
    isOpen: false,
    title: "",
    description: "",
    onConfirm: null,
    confirmText: "Delete",
  },

  // Initial rename dialog state
  renameDialog: {
    isOpen: false,
    title: "",
    currentValue: "",
    onConfirm: null,
  },

  // Initial settings state
  settings: createDefaultSettings(),
  settingsLoaded: false,

  // Initial settings dialog state
  settingsDialog: {
    isOpen: false,
    activeTab: "providers",
  },

  // Canvas actions
  setNodes: (nodes: CustomNode[]) => {
    set({ nodes, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  setEdges: (edges: Edge[]) => {
    set({ edges, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  // Internal setters for React Flow changes (don't mark as unsaved)
  setNodesInternal: (nodes: CustomNode[]) => {
    set({ nodes });
  },

  setEdgesInternal: (edges: Edge[]) => {
    set({ edges });
  },

  updateNodeData: (
    nodeId: string,
    data: Partial<BaseNodeData & Record<string, any>>
  ) => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ) as CustomNode[];
    set({ nodes: updatedNodes, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  updateNodeDataDuringExecution: (
    nodeId: string,
    data: Partial<BaseNodeData & Record<string, any>>
  ) => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ) as CustomNode[];
    set({ nodes: updatedNodes });
  },

  updateNodeStatus: (
    nodeId: string,
    status: "idle" | "running" | "success" | "error",
    error?: string
  ) => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, status, error } }
        : node
    ) as CustomNode[];
    set({ nodes: updatedNodes });
  },

  // Text node history management (save points only)
  undoTextChange: (nodeId: string) => {
    try {
      const { nodes } = get();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.type !== "textPrompt") {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[undoTextChange] Node ${nodeId} not found or not a text prompt`);
        }
        return false;
      }
      const textNodeData = node.data as TextPromptNodeData;
      if (!textNodeData.history || textNodeData.history.undoStack.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[undoTextChange] No history available for ${nodeId}`);
        }
        return false;
      }

      const history = textNodeData.history;

      // Move current state to redo stack
      if (!history.redoStack) {
        history.redoStack = [];
      }
      history.redoStack.push({
        timestamp: Date.now(),
        text: textNodeData.text,
      });

      // Get previous state from undo stack
      const lastEntry = history.undoStack.pop();
      if (lastEntry) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[undoTextChange] Undoing ${nodeId}: "${textNodeData.text}" -> "${lastEntry.text}"`);
        }

        // Create properly updated nodes array with immutable updates
        const updatedNodes = nodes.map((n) =>
          n.id === nodeId
            ? {
              ...n,
              data: {
                ...n.data,
                text: lastEntry.text,
                characterCount: lastEntry.text.length,
                history: {
                  ...history,
                  undoStack: [...history.undoStack],
                  redoStack: [...history.redoStack],
                },
              },
            }
            : n
        ) as CustomNode[];

        // Limit redo stack size
        if (history.redoStack.length > 100) {
          history.redoStack.shift();
        }

        set({ nodes: updatedNodes, hasUnsavedChanges: true });
        get().markSessionAsUnsaved();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[undoTextChange] Error during undo for ${nodeId}:`, error);
      return false;
    }
  },

  redoTextChange: (nodeId: string) => {
    try {
      const { nodes } = get();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.type !== "textPrompt") {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[redoTextChange] Node ${nodeId} not found or not a text prompt`);
        }
        return false;
      }
      const textNodeData = node.data as TextPromptNodeData;
      if (!textNodeData.history || textNodeData.history.redoStack.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[redoTextChange] No redo history available for ${nodeId}`);
        }
        return false;
      }

      const history = textNodeData.history;

      // Move current state to undo stack
      if (!history.undoStack) {
        history.undoStack = [];
      }
      history.undoStack.push({
        timestamp: Date.now(),
        text: textNodeData.text,
      });

      // Get next state from redo stack
      const nextEntry = history.redoStack.pop();
      if (nextEntry) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[redoTextChange] Redoing ${nodeId}: "${textNodeData.text}" -> "${nextEntry.text}"`);
        }

        // Create properly updated nodes array with immutable updates
        const updatedNodes = nodes.map((n) =>
          n.id === nodeId
            ? {
              ...n,
              data: {
                ...n.data,
                text: nextEntry.text,
                characterCount: nextEntry.text.length,
                history: {
                  ...history,
                  undoStack: [...history.undoStack],
                  redoStack: [...history.redoStack],
                },
              },
            }
            : n
        ) as CustomNode[];

        // Limit undo stack size
        if (history.undoStack.length > 100) {
          history.undoStack.shift();
        }

        set({ nodes: updatedNodes, hasUnsavedChanges: true });
        get().markSessionAsUnsaved();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[redoTextChange] Error during redo for ${nodeId}:`, error);
      return false;
    }
  },

  captureTextHistoryAtSavePoint: () => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) => {
      if (node.type === "textPrompt") {
        const textNodeData = node.data as TextPromptNodeData;
        if (textNodeData.text) {
          // Initialize history if it doesn't exist
          if (!textNodeData.history) {
            textNodeData.history = {
              undoStack: [],
              redoStack: [],
            };
          }

          const history = textNodeData.history;

          // Add current text to history when saving
          const newUndoStack = [...history.undoStack];
          newUndoStack.push({
            timestamp: Date.now(),
            text: textNodeData.text,
          });

          // Limit history size
          if (newUndoStack.length > 100) {
            newUndoStack.shift();
          }

          return {
            ...node,
            data: {
              ...node.data,
              history: {
                undoStack: newUndoStack,
                redoStack: [], // Clear redo stack at save point
              },
            },
          };
        }
      }
      return node;
    }) as CustomNode[];

    set({ nodes: updatedNodes });
  },

  // Workflow actions
  startWorkflow: () => {
    set({
      workflow: {
        isRunning: true,
        currentNode: undefined,
        completedNodes: [],
        errorNodes: [],
      },
    });
    get().markSessionAsRunning();
  },

  stopWorkflow: () => {
    const { workflow, activeSessionId } = get();

    // Only proceed if workflow is actually running
    if (!workflow.isRunning) {
      return;
    }

    set({
      workflow: {
        ...workflow,
        isRunning: false,
        currentNode: undefined,
      },
    });

    // If workflow is being stopped manually and session isn't already in error state,
    // mark as saved (assuming no unsaved changes from the workflow execution itself)
    if (activeSessionId) {
      const hasErrors = workflow.errorNodes.length > 0;
      if (!hasErrors) {
        get().updateSessionMetadata(
          activeSessionId,
          {
            isRunning: false,
            status: SessionStatus.SAVED,
          },
          false
        );
      } else {
        // Just mark as not running if there were errors (status already set to ERROR)
        get().updateSessionMetadata(
          activeSessionId,
          { isRunning: false },
          false
        );
      }
    }
  },

  markNodeCompleted: (nodeId: string) => {
    const { workflow } = get();
    set({
      workflow: {
        ...workflow,
        completedNodes: [...workflow.completedNodes, nodeId],
        currentNode: undefined,
      },
    });

    // Check if this completed the entire workflow
    get().checkWorkflowCompletion();
  },

  markNodeError: (nodeId: string, error: string) => {
    const { workflow, nodes } = get();

    // Update workflow state
    set({
      workflow: {
        ...workflow,
        errorNodes: [...workflow.errorNodes, nodeId],
        currentNode: undefined,
        isRunning: false,
      },
    });

    // Update node status
    get().updateNodeStatus(nodeId, "error", error);

    // Mark session as error
    const { activeSessionId } = get();
    if (activeSessionId) {
      get().markSessionAsError(activeSessionId, error);
    }
  },

  resetWorkflow: () => {
    set({
      workflow: {
        isRunning: false,
        currentNode: undefined,
        completedNodes: [],
        errorNodes: [],
      },
    });

    // Reset all node statuses to idle
    const { nodes } = get();
    const resetNodes = nodes.map((node) => ({
      ...node,
      data: { ...node.data, status: "idle" as const, error: undefined },
    })) as CustomNode[];
    set({ nodes: resetNodes, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  // Session operations
  createSession: async (name?: string): Promise<string> => {
    set({ isLoading: true, error: null });

    try {
      const session = await sessionService.createSession(
        name,
        initialNodes,
        initialEdges
      );

      const { sessions } = get();
      set({
        sessions: { ...sessions, [session.id]: session },
        activeSessionId: session.id,
        hasUnsavedChanges: false,
        isLoading: false,
      });

      get().filterSessions();
      return session.id;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create session";
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  loadSession: async (sessionId: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const session = await sessionService.loadSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      set({
        nodes: session.nodes,
        edges: session.edges,
        activeSessionId: sessionId,
        hasUnsavedChanges: false,
        workflow: {
          isRunning: false,
          currentNode: undefined,
          completedNodes: [],
          errorNodes: [],
        },
        isLoading: false,
      });

      const { sessions } = get();
      set({ sessions: { ...sessions, [sessionId]: session } });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load session";
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  saveSession: async (sessionId?: string): Promise<void> => {
    const { activeSessionId, nodes, edges, sessions } = get();
    const targetSessionId = sessionId || activeSessionId;

    if (!targetSessionId) {
      throw new Error("No active session to save");
    }

    set({ isLoading: true, error: null });

    try {
      // Capture history at save point before saving
      get().captureTextHistoryAtSavePoint();

      const currentSession = sessions[targetSessionId];
      if (!currentSession) {
        throw new Error("Session not found");
      }

      const updatedSession: Session = {
        ...currentSession,
        nodes: [...nodes],
        edges: [...edges],
        updatedAt: new Date().toISOString(),
        metadata: {
          ...currentSession.metadata,
          hasUnsavedChanges: false,
          nodeCount: nodes.length,
          status: SessionStatus.SAVED,
        },
      };

      await sessionService.saveSession(updatedSession);

      set({
        sessions: { ...sessions, [targetSessionId]: updatedSession },
        hasUnsavedChanges: false,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save session";
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const success = await sessionService.deleteSession(sessionId);
      if (!success) {
        throw new Error("Failed to delete session");
      }

      const { sessions, activeSessionId } = get();
      const { [sessionId]: deleted, ...remainingSessions } = sessions;

      set({
        sessions: remainingSessions,
        activeSessionId: activeSessionId === sessionId ? null : activeSessionId,
        isLoading: false,
      });

      get().filterSessions();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete session";
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  duplicateSession: async (sessionId: string): Promise<string> => {
    set({ isLoading: true, error: null });

    try {
      const duplicatedSession = await sessionService.duplicateSession(
        sessionId
      );
      if (!duplicatedSession) {
        throw new Error("Failed to duplicate session");
      }

      const { sessions } = get();
      set({
        sessions: { ...sessions, [duplicatedSession.id]: duplicatedSession },
        isLoading: false,
      });

      get().filterSessions();
      return duplicatedSession.id;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to duplicate session";
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  renameSession: async (sessionId: string, newName: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const success = await sessionService.renameSession(sessionId, newName);
      if (!success) {
        throw new Error("Failed to rename session");
      }

      await get().refreshSessions();
      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to rename session";
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Session management
  setActiveSession: (sessionId: string) => {
    set({ activeSessionId: sessionId });
  },

  updateSessionMetadata: (
    sessionId: string,
    metadata: Partial<SessionMetadata>,
    updateTimestamp: boolean = false
  ) => {
    const { sessions } = get();
    const session = sessions[sessionId];
    if (!session) return;

    const updatedSession = {
      ...session,
      metadata: { ...session.metadata, ...metadata },
    };

    set({ sessions: { ...sessions, [sessionId]: updatedSession } });

    // Also update in persistence
    sessionService.updateSessionMetadata(sessionId, metadata, updateTimestamp);
  },

  markSessionAsUnsaved: (sessionId?: string) => {
    const { activeSessionId } = get();
    const targetSessionId = sessionId || activeSessionId;

    if (targetSessionId) {
      get().updateSessionMetadata(
        targetSessionId,
        {
          hasUnsavedChanges: true,
          status: SessionStatus.UNSAVED,
        },
        true
      ); // Update timestamp since this represents actual content changes
    }
  },

  markSessionAsRunning: (sessionId?: string) => {
    const { activeSessionId } = get();
    const targetSessionId = sessionId || activeSessionId;

    if (targetSessionId) {
      get().updateSessionMetadata(
        targetSessionId,
        {
          isRunning: true,
          status: SessionStatus.RUNNING,
          lastExecutionTime: new Date().toISOString(),
          errorMessage: undefined, // Clear any previous error when starting new workflow
        },
        false
      ); // Don't update timestamp for status changes
    }
  },

  markSessionAsError: (sessionId: string, error: string) => {
    get().updateSessionMetadata(
      sessionId,
      {
        isRunning: false,
        status: SessionStatus.ERROR,
        errorMessage: error,
      },
      false
    ); // Don't update timestamp for status changes
  },

  // Mark session as completed (successful workflow execution)
  markSessionAsCompleted: (sessionId: string) => {
    get().updateSessionMetadata(
      sessionId,
      {
        isRunning: false,
        status: SessionStatus.SAVED,
      },
      false
    ); // Don't update timestamp for status changes
  },

  // Helper method to check if workflow is completed
  checkWorkflowCompletion: () => {
    const { workflow, nodes, activeSessionId } = get();

    if (!workflow.isRunning || !activeSessionId) {
      return;
    }

    // Get all nodes that should be executed
    const executableNodes = nodes.filter((node) => {
      // All nodes are considered executable in this implementation
      return true;
    });

    const totalExecutableNodes = executableNodes.length;
    const completedNodesCount = workflow.completedNodes.length;
    const errorNodesCount = workflow.errorNodes.length;

    // Check if all nodes are either completed or errored
    const allNodesProcessed =
      completedNodesCount + errorNodesCount >= totalExecutableNodes;

    if (allNodesProcessed) {
      // Stop the workflow state
      set({
        workflow: {
          ...workflow,
          isRunning: false,
          currentNode: undefined,
        },
      });

      // If there are no error nodes, mark as completed successfully
      if (errorNodesCount === 0) {
        get().markSessionAsCompleted(activeSessionId);
      }
      // If there are error nodes, the session should already be marked as error by markNodeError
    }
  },

  // Search and filtering
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().filterSessions();
  },

  filterSessions: async () => {
    const { searchQuery, sessions } = get();

    if (!searchQuery.trim()) {
      set({ filteredSessionIds: Object.keys(sessions) });
      return;
    }

    try {
      const filteredIds = await sessionService.searchSessions(searchQuery);
      set({ filteredSessionIds: filteredIds });
    } catch (error) {
      console.error("Search failed:", error);
      set({ filteredSessionIds: [] });
    }
  },

  refreshSessions: async () => {
    set({ isLoading: true, error: null });

    try {
      const sessions = await sessionService.getAllSessions();
      set({ sessions, isLoading: false });
      get().filterSessions();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to refresh sessions";
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Export/Import
  exportSession: async (sessionId: string): Promise<string | null> => {
    try {
      return await sessionService.exportSession(sessionId);
    } catch (error) {
      console.error("Export failed:", error);
      return null;
    }
  },

  importSession: async (sessionData: string): Promise<string | null> => {
    set({ isLoading: true, error: null });

    try {
      const importedSession = await sessionService.importSession(sessionData);
      if (!importedSession) {
        throw new Error("Failed to import session");
      }

      const { sessions } = get();
      set({
        sessions: { ...sessions, [importedSession.id]: importedSession },
        isLoading: false,
      });

      get().filterSessions();
      return importedSession.id;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to import session";
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  exportAllSessions: async (): Promise<string> => {
    try {
      return await sessionService.exportAllSessions();
    } catch (error) {
      console.error("Export all failed:", error);
      throw new Error("Failed to export sessions");
    }
  },

  // Auto-save
  enableAutoSave: () => {
    set({ autoSaveEnabled: true });
  },

  disableAutoSave: () => {
    set({ autoSaveEnabled: false });
  },

  triggerAutoSave: async () => {
    const { autoSaveEnabled, hasUnsavedChanges, activeSessionId } = get();

    if (autoSaveEnabled && hasUnsavedChanges && activeSessionId) {
      try {
        await get().saveSession();
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }
  },

  // Confirmation dialog
  showConfirmationDialog: (
    title: string,
    description: string,
    onConfirm: () => void,
    confirmText?: string
  ) => {
    set({
      confirmationDialog: {
        isOpen: true,
        title,
        description,
        onConfirm,
        confirmText,
      },
    });
  },

  hideConfirmationDialog: () => {
    set({
      confirmationDialog: {
        isOpen: false,
        title: "",
        description: "",
        onConfirm: null,
      },
    });
  },

  // Rename dialog
  showRenameDialog: (
    title: string,
    currentValue: string,
    onConfirm: (newName: string) => void
  ) => {
    set({
      renameDialog: {
        isOpen: true,
        title,
        currentValue,
        onConfirm,
      },
    });
  },

  hideRenameDialog: () => {
    set({
      renameDialog: {
        isOpen: false,
        title: "",
        currentValue: "",
        onConfirm: null,
      },
    });
  },

  // Settings actions
  updateSettings: async (settingsUpdate: Partial<AppSettings>) => {
    try {
      const { settings } = get();
      const newSettings = { ...settings, ...settingsUpdate };

      await settingsService.saveSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  },

  updateProviderSettings: async (
    provider: LLMProvider,
    providerSettings: Partial<ProviderSettings>
  ) => {
    try {
      await settingsService.updateProviderSettings(provider, providerSettings);

      const { settings } = get();
      const newSettings = {
        ...settings,
        providers: {
          ...settings.providers,
          [provider]: {
            ...settings.providers[provider],
            ...providerSettings,
          },
        },
      };

      set({ settings: newSettings });
    } catch (error) {
      console.error("Failed to update provider settings:", error);
      throw error;
    }
  },

  setApiKey: async (provider: LLMProvider, apiKey: string) => {
    try {
      await settingsService.saveApiKey(provider, apiKey);
      // Note: API keys are not stored in the settings state for security
    } catch (error) {
      console.error("Failed to save API key:", error);
      throw error;
    }
  },

  getApiKey: async (provider: LLMProvider) => {
    try {
      return await settingsService.getApiKey(provider);
    } catch (error) {
      console.error("Failed to get API key:", error);
      return null;
    }
  },

  // Theme actions
  setTheme: async (theme: ThemeMode) => {
    try {
      // Update settings which will persist the theme
      await get().updateSettings({ theme });

      // The actual DOM theme application will be handled by the useThemeSync hook
      if (process.env.NODE_ENV === 'development') {
        console.log(`Theme set to: ${theme}`);
      }
    } catch (error) {
      console.error("Failed to set theme:", error);
      throw error;
    }
  },

  initializeTheme: async () => {
    try {
      // Import theme service
      const { themeService } = await import("@/lib/theme-service");

      // Initialize the theme service
      await themeService.initializeTheme();

      if (process.env.NODE_ENV === 'development') {
        console.log("Theme initialized");
      }
    } catch (error) {
      console.error("Failed to initialize theme:", error);
    }
  },

  // Settings dialog actions
  openSettingsDialog: (tab: string = "providers") => {
    set({
      settingsDialog: {
        isOpen: true,
        activeTab: tab,
      },
    });
  },

  closeSettingsDialog: () => {
    set({
      settingsDialog: {
        isOpen: false,
        activeTab: "providers",
      },
    });
  },

  toggleSettingsDialog: () => {
    set({
      settingsDialog: {
        isOpen: !get().settingsDialog.isOpen,
        activeTab: get().settingsDialog.activeTab,
      },
    });
  },

  // Settings export/import
  exportSettings: async () => {
    try {
      return await settingsService.exportSettings();
    } catch (error) {
      console.error("Failed to export settings:", error);
      throw error;
    }
  },

  importSettings: async (data: string) => {
    try {
      await settingsService.importSettings(data);
      const settings = await settingsService.loadSettings();
      set({ settings });
    } catch (error) {
      console.error("Failed to import settings:", error);
      throw error;
    }
  },

  resetSettings: async () => {
    try {
      await settingsService.resetSettings();
      const settings = await settingsService.loadSettings();
      set({ settings });
    } catch (error) {
      console.error("Failed to reset settings:", error);
      throw error;
    }
  },

  // Initialization
  initializeStore: async () => {
    set({ isLoading: true, error: null });

    try {
      // Initialize services
      await sessionService.initialize();
      await settingsService.initialize();

      // Load settings
      const settings = await settingsService.loadSettings();
      set({ settings, settingsLoaded: true });

      // Load sessions
      await get().refreshSessions();

      // Create default session if no sessions exist
      const { sessions } = get();
      if (Object.keys(sessions).length === 0) {
        await get().createSession("Example Session");
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initialize store";
      set({ error: errorMessage, isLoading: false });
    }
  },
}));
