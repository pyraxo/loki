import { initialEdges, initialNodes } from "@/components/nodes/defaults";
import { sessionService } from "@/lib/session-service";
import { type Session, type SessionMetadata, SessionStatus } from "@/types/sessions";
import { type StateCreator } from "zustand";
import { type SessionSlice, type StoreState } from "../types";

export const createSessionSlice: StateCreator<
  StoreState,
  [],
  [],
  SessionSlice
> = (set, get) => ({
  // Initial state
  sessions: {},
  activeSessionId: null,
  searchQuery: "",
  filteredSessionIds: [],
  isLoading: false,
  error: null,

  // Session operations
  createSession: async (name?: string): Promise<string> => {
    set({ isLoading: true, error: null });

    try {
      const { viewport } = get();
      const session = await sessionService.createSession(
        name,
        initialNodes,
        initialEdges,
        viewport
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
        viewport: session.viewport || { x: 0, y: 0, zoom: 1 },
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
    const { activeSessionId, nodes, edges, viewport, sessions } = get();
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
        viewport: { ...viewport },
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
}); 