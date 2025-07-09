import { type CustomNode } from "./nodes";
import { type Edge } from "@xyflow/react";

// Session status enumeration
export enum SessionStatus {
  SAVED = "saved",
  UNSAVED = "unsaved",
  RUNNING = "running",
  ERROR = "error",
}

// Core session data structure
export interface Session {
  id: string;
  name: string;
  nodes: CustomNode[];
  edges: Edge[];
  metadata: SessionMetadata;
  createdAt: string;
  updatedAt: string;
}

// Session metadata for display and management
export interface SessionMetadata {
  status: SessionStatus;
  nodeCount: number;
  lastExecutionTime?: string;
  hasUnsavedChanges: boolean;
  isRunning: boolean;
  errorMessage?: string;
  tags?: string[];
  description?: string;
}

// Session store state interface
export interface SessionStore {
  sessions: Record<string, Session>;
  activeSessionId: string | null;
  searchQuery: string;
  filteredSessionIds: string[];
  isLoading: boolean;
  error: string | null;

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
  markSessionAsUnsaved: (sessionId: string) => void;
  markSessionAsRunning: (sessionId: string) => void;
  markSessionAsError: (sessionId: string, error: string) => void;

  // Search and filtering
  setSearchQuery: (query: string) => void;
  filterSessions: () => void;

  // Export/Import
  exportSession: (sessionId: string) => Promise<string>;
  importSession: (sessionData: string) => Promise<string>;
  exportAllSessions: () => Promise<string>;

  // Auto-save
  enableAutoSave: () => void;
  disableAutoSave: () => void;
}

// Session creation options
export interface CreateSessionOptions {
  name?: string;
  copyFrom?: string; // sessionId to copy from
  initialNodes?: CustomNode[];
  initialEdges?: Edge[];
}

// Session export format
export interface SessionExport {
  version: string;
  exportedAt: string;
  session: Session;
}

// Bulk session export format
export interface SessionBulkExport {
  version: string;
  exportedAt: string;
  sessions: Session[];
}

// Session search result
export interface SessionSearchResult {
  sessionId: string;
  matchType: "name" | "content" | "metadata";
  matchedText: string;
  relevanceScore: number;
}
