import { Store } from "@tauri-apps/plugin-store";
import {
  type Session,
  type SessionMetadata,
  type SessionExport,
  type SessionBulkExport,
  SessionStatus,
} from "@/types/sessions";
import { type CustomNode } from "@/types/nodes";
import { type Edge } from "@xyflow/react";

const SESSION_STORE_KEY = "loki-sessions.json";

class SessionService {
  private store: Store | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized && this.store) return;

    try {
      // Load or create the store
      this.store = await Store.load(SESSION_STORE_KEY);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize session service:", error);
      throw new Error("Session service initialization failed");
    }
  }

  private async ensureStore(): Promise<Store> {
    if (!this.store) {
      await this.initialize();
    }
    if (!this.store) {
      throw new Error("Store not initialized");
    }
    return this.store;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate default session name
  private generateSessionName(existingNames: string[]): string {
    let counter = 1;
    let baseName = "Untitled Session";
    let name = baseName;

    while (existingNames.includes(name)) {
      name = `${baseName} ${counter}`;
      counter++;
    }

    return name;
  }

  // Create a new session
  async createSession(
    name?: string,
    nodes: CustomNode[] = [],
    edges: Edge[] = []
  ): Promise<Session> {
    const store = await this.ensureStore();

    const sessions = await this.getAllSessions();
    const existingNames = Object.values(sessions).map((s) => s.name);

    const sessionId = this.generateSessionId();
    const sessionName = name || this.generateSessionName(existingNames);
    const now = new Date().toISOString();

    const session: Session = {
      id: sessionId,
      name: sessionName,
      nodes,
      edges,
      metadata: {
        status: SessionStatus.SAVED,
        nodeCount: nodes.length,
        hasUnsavedChanges: false,
        isRunning: false,
      },
      createdAt: now,
      updatedAt: now,
    };

    await store.set(sessionId, session);
    await store.save();

    return session;
  }

  // Load a specific session
  async loadSession(sessionId: string): Promise<Session | null> {
    const store = await this.ensureStore();

    try {
      const session = await store.get<Session>(sessionId);
      return session || null;
    } catch (error) {
      console.error(`Failed to load session ${sessionId}:`, error);
      return null;
    }
  }

  // Save/update a session
  async saveSession(session: Session): Promise<void> {
    const store = await this.ensureStore();

    const updatedSession: Session = {
      ...session,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...session.metadata,
        nodeCount: session.nodes.length,
        hasUnsavedChanges: false,
        status: SessionStatus.SAVED,
      },
    };

    await store.set(session.id, updatedSession);
    await store.save();
  }

  // Delete a session
  async deleteSession(sessionId: string): Promise<boolean> {
    const store = await this.ensureStore();

    try {
      const exists = await store.has(sessionId);
      if (!exists) return false;

      await store.delete(sessionId);
      await store.save();
      return true;
    } catch (error) {
      console.error(`Failed to delete session ${sessionId}:`, error);
      return false;
    }
  }

  // Get all sessions
  async getAllSessions(): Promise<Record<string, Session>> {
    const store = await this.ensureStore();

    try {
      const keys = await store.keys();
      const sessions: Record<string, Session> = {};

      for (const key of keys) {
        const session = await store.get<Session>(key);
        if (session) {
          sessions[key] = session;
        }
      }

      return sessions;
    } catch (error) {
      console.error("Failed to load sessions:", error);
      return {};
    }
  }

  // Duplicate a session
  async duplicateSession(sessionId: string): Promise<Session | null> {
    const originalSession = await this.loadSession(sessionId);
    if (!originalSession) return null;

    const sessions = await this.getAllSessions();
    const existingNames = Object.values(sessions).map((s) => s.name);
    const duplicateName = `${originalSession.name} (Copy)`;

    return await this.createSession(
      this.generateSessionName([...existingNames, duplicateName]),
      [...originalSession.nodes],
      [...originalSession.edges]
    );
  }

  // Update session metadata
  async updateSessionMetadata(
    sessionId: string,
    metadata: Partial<SessionMetadata>,
    updateTimestamp: boolean = false
  ): Promise<void> {
    const store = await this.ensureStore();

    const session = await this.loadSession(sessionId);
    if (!session) return;

    const updatedSession: Session = {
      ...session,
      metadata: { ...session.metadata, ...metadata },
      // Only update timestamp for meaningful changes, not status updates
      ...(updateTimestamp && { updatedAt: new Date().toISOString() }),
    };

    await store.set(sessionId, updatedSession);
    await store.save();
  }

  // Rename a session
  async renameSession(sessionId: string, newName: string): Promise<boolean> {
    const store = await this.ensureStore();

    const session = await this.loadSession(sessionId);
    if (!session) return false;

    const updatedSession: Session = {
      ...session,
      name: newName.trim(),
      updatedAt: new Date().toISOString(),
    };

    await store.set(sessionId, updatedSession);
    await store.save();
    return true;
  }

  // Export session to JSON string
  async exportSession(sessionId: string): Promise<string | null> {
    const session = await this.loadSession(sessionId);
    if (!session) return null;

    const exportData: SessionExport = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      session,
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import session from JSON string
  async importSession(sessionData: string): Promise<Session | null> {
    try {
      const importData: SessionExport = JSON.parse(sessionData);

      if (!importData.session) {
        throw new Error("Invalid session data format");
      }

      // Generate new ID and ensure unique name
      const sessions = await this.getAllSessions();
      const existingNames = Object.values(sessions).map((s) => s.name);

      const importedSession = await this.createSession(
        this.generateSessionName([...existingNames, importData.session.name]),
        importData.session.nodes,
        importData.session.edges
      );

      return importedSession;
    } catch (error) {
      console.error("Failed to import session:", error);
      return null;
    }
  }

  // Export all sessions
  async exportAllSessions(): Promise<string> {
    const sessions = await this.getAllSessions();
    const exportData: SessionBulkExport = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      sessions: Object.values(sessions),
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Search sessions by content
  async searchSessions(query: string): Promise<string[]> {
    if (!query.trim()) return [];

    const sessions = await this.getAllSessions();
    const results: Array<{ id: string; score: number }> = [];

    const searchTerms = query.toLowerCase().split(/\s+/);

    for (const [sessionId, session] of Object.entries(sessions)) {
      let score = 0;

      // Search in session name
      const nameMatches = searchTerms.filter((term) =>
        session.name.toLowerCase().includes(term)
      ).length;
      score += nameMatches * 10;

      // Search in node content
      for (const node of session.nodes) {
        if (node.data.content && typeof node.data.content === "string") {
          const contentMatches = searchTerms.filter((term) =>
            (node.data.content as string).toLowerCase().includes(term)
          ).length;
          score += contentMatches * 5;
        }

        if (node.data.title && typeof node.data.title === "string") {
          const titleMatches = searchTerms.filter((term) =>
            (node.data.title as string).toLowerCase().includes(term)
          ).length;
          score += titleMatches * 3;
        }
      }

      if (score > 0) {
        results.push({ id: sessionId, score });
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);
    return results.map((r) => r.id);
  }

  // Clear all session data (for testing/reset)
  async clearAllSessions(): Promise<void> {
    const store = await this.ensureStore();
    await store.clear();
    await store.save();
  }
}

// Singleton instance
export const sessionService = new SessionService();
