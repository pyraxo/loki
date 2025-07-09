import { create } from "zustand";
import { type Edge } from "@xyflow/react";
import {
  type CustomNode,
  type WorkflowState,
  type NodeData,
} from "@/types/nodes";
import {
  type Session,
  type SessionMetadata,
  SessionStatus,
} from "@/types/sessions";
import { sessionService } from "./session-service";

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

  // Canvas actions
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  updateNodeStatus: (
    nodeId: string,
    status: "idle" | "running" | "success" | "error",
    error?: string
  ) => void;

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
    metadata: Partial<SessionMetadata>
  ) => void;
  markSessionAsUnsaved: (sessionId?: string) => void;
  markSessionAsRunning: (sessionId?: string) => void;
  markSessionAsError: (sessionId: string, error: string) => void;

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

  // Initialization
  initializeStore: () => Promise<void>;
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

  // Canvas actions
  setNodes: (nodes: CustomNode[]) => {
    set({ nodes, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  setEdges: (edges: Edge[]) => {
    set({ edges, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    );
    set({ nodes: updatedNodes, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
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
    );
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
    const { workflow } = get();
    set({
      workflow: {
        ...workflow,
        isRunning: false,
        currentNode: undefined,
      },
    });

    const { activeSessionId } = get();
    if (activeSessionId) {
      get().updateSessionMetadata(activeSessionId, { isRunning: false });
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
    }));
    set({ nodes: resetNodes, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  // Session operations
  createSession: async (name?: string): Promise<string> => {
    set({ isLoading: true, error: null });

    try {
      const { nodes, edges } = get();
      const session = await sessionService.createSession(name, nodes, edges);

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
    metadata: Partial<SessionMetadata>
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
    sessionService.updateSessionMetadata(sessionId, metadata);
  },

  markSessionAsUnsaved: (sessionId?: string) => {
    const { activeSessionId } = get();
    const targetSessionId = sessionId || activeSessionId;

    if (targetSessionId) {
      get().updateSessionMetadata(targetSessionId, {
        hasUnsavedChanges: true,
        status: SessionStatus.UNSAVED,
      });
    }
  },

  markSessionAsRunning: (sessionId?: string) => {
    const { activeSessionId } = get();
    const targetSessionId = sessionId || activeSessionId;

    if (targetSessionId) {
      get().updateSessionMetadata(targetSessionId, {
        isRunning: true,
        status: SessionStatus.RUNNING,
        lastExecutionTime: new Date().toISOString(),
      });
    }
  },

  markSessionAsError: (sessionId: string, error: string) => {
    get().updateSessionMetadata(sessionId, {
      isRunning: false,
      status: SessionStatus.ERROR,
      errorMessage: error,
    });
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

  // Initialization
  initializeStore: async () => {
    set({ isLoading: true, error: null });

    try {
      await sessionService.initialize();
      await get().refreshSessions();

      // Create default session if no sessions exist
      const { sessions } = get();
      if (Object.keys(sessions).length === 0) {
        await get().createSession("Audio Processing");
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initialize store";
      set({ error: errorMessage, isLoading: false });
    }
  },
}));
