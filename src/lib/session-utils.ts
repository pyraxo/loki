import { useEffect, useRef } from "react";
import { useStore } from "./store";

// Auto-save hook
export function useAutoSave(intervalMs: number = 30000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { triggerAutoSave, autoSaveEnabled, hasUnsavedChanges } = useStore();

  useEffect(() => {
    if (autoSaveEnabled) {
      intervalRef.current = setInterval(() => {
        if (hasUnsavedChanges) {
          triggerAutoSave();
        }
      }, intervalMs);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoSaveEnabled, hasUnsavedChanges, triggerAutoSave, intervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

// Session state management utilities
export const SessionUtils = {
  // Generate a unique session name
  generateSessionName: (
    existingNames: string[],
    baseName: string = "Untitled Session"
  ): string => {
    let counter = 1;
    let name = baseName;

    while (existingNames.includes(name)) {
      name = `${baseName} ${counter}`;
      counter++;
    }

    return name;
  },

  // Format session timestamp for display
  formatTimestamp: (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
    } catch {
      return "Unknown";
    }
  },

  // Deep compare objects for change detection
  deepEqual: (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;

    if (obj1 == null || obj2 == null) return false;

    if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!SessionUtils.deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  },

  // Validate session data before import
  validateSessionData: (data: any): boolean => {
    if (!data || typeof data !== "object") return false;

    // Check for required fields
    const requiredFields = ["version", "session"];
    for (const field of requiredFields) {
      if (!(field in data)) return false;
    }

    const session = data.session;
    if (!session || typeof session !== "object") return false;

    // Check session structure
    const sessionFields = [
      "id",
      "name",
      "nodes",
      "edges",
      "metadata",
      "createdAt",
      "updatedAt",
    ];
    for (const field of sessionFields) {
      if (!(field in session)) return false;
    }

    return true;
  },

  // Sanitize session name
  sanitizeSessionName: (name: string): string => {
    return name
      .trim()
      .replace(/[<>:"/\\|?*]/g, "") // Remove invalid filename characters
      .substring(0, 100); // Limit length
  },

  // Calculate session size for display
  calculateSessionSize: (session: any): string => {
    const jsonString = JSON.stringify(session);
    const bytes = new Blob([jsonString]).size;

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  // Get session health status
  getSessionHealth: (session: any): { status: string; issues: string[] } => {
    const issues: string[] = [];

    // Check for empty session
    if (!session.nodes || session.nodes.length === 0) {
      issues.push("No nodes in workflow");
    }

    // Check for disconnected nodes
    if (
      session.nodes.length > 1 &&
      (!session.edges || session.edges.length === 0)
    ) {
      issues.push("Nodes not connected");
    }

    // Check for missing start node
    const hasStartNode = session.nodes.some(
      (node: any) => node.type === "START"
    );
    if (!hasStartNode && session.nodes.length > 0) {
      issues.push("No start node found");
    }

    // Check for orphaned nodes (nodes with no connections)
    if (session.edges && session.edges.length > 0) {
      const connectedNodeIds = new Set();
      session.edges.forEach((edge: any) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      const orphanedNodes = session.nodes.filter(
        (node: any) => !connectedNodeIds.has(node.id) && node.type !== "START"
      );

      if (orphanedNodes.length > 0) {
        issues.push(`${orphanedNodes.length} disconnected nodes`);
      }
    }

    let status = "healthy";
    if (issues.length > 0) {
      status = issues.some(
        (issue) =>
          issue.includes("No start node") || issue.includes("not connected")
      )
        ? "error"
        : "warning";
    }

    return { status, issues };
  },
};

// Keyboard shortcuts for session management
export function useSessionShortcuts() {
  const {
    createSession,
    saveSession,
    loadSession,
    sessions,
    activeSessionId,
    duplicateSession,
    renameSession,
    exportSession,
    deleteSession,
    showConfirmationDialog,
    showRenameDialog,
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if focus is on an input element
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement as HTMLElement).contentEditable === "true");

      // Cmd/Ctrl + N - New session
      if ((event.metaKey || event.ctrlKey) && event.key === "n") {
        event.preventDefault();
        createSession();
      }

      // Cmd/Ctrl + S - Save session
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        if (activeSessionId) {
          saveSession();
        }
      }

      // F2 - Rename active session
      if (event.key === "F2" && !isInputFocused && activeSessionId) {
        event.preventDefault();
        const currentSession = sessions[activeSessionId];
        if (currentSession) {
          showRenameDialog(
            "Rename Session",
            currentSession.name,
            (newName: string) => renameSession(activeSessionId, newName)
          );
        }
      }

      // Cmd/Ctrl + D - Duplicate active session
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "d" &&
        !isInputFocused &&
        activeSessionId
      ) {
        event.preventDefault();
        duplicateSession(activeSessionId);
      }

      // Cmd/Ctrl + E - Export active session
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "e" &&
        !isInputFocused &&
        activeSessionId
      ) {
        event.preventDefault();
        const currentSession = sessions[activeSessionId];
        if (currentSession) {
          exportSession(activeSessionId)
            .then((exportData) => {
              if (exportData) {
                const blob = new Blob([exportData], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${currentSession.name}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            })
            .catch((error) => {
              console.error("Export failed:", error);
            });
        }
      }

      // Cmd/Ctrl + Delete - Delete active session (with confirmation)
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "Delete" &&
        !isInputFocused &&
        activeSessionId
      ) {
        event.preventDefault();
        const currentSession = sessions[activeSessionId];
        if (currentSession) {
          showConfirmationDialog(
            "Delete Session",
            `Are you sure you want to delete "${currentSession.name}"? This action cannot be undone.`,
            () => deleteSession(activeSessionId)
          );
        }
      }

      // Cmd/Ctrl + 1-9 - Switch to session by index
      if ((event.metaKey || event.ctrlKey) && /^[1-9]$/.test(event.key)) {
        event.preventDefault();
        const sessionIndex = parseInt(event.key) - 1;
        const sessionIds = Object.keys(sessions);
        if (sessionIndex < sessionIds.length) {
          loadSession(sessionIds[sessionIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    createSession,
    saveSession,
    loadSession,
    sessions,
    activeSessionId,
    duplicateSession,
    renameSession,
    exportSession,
    deleteSession,
    showConfirmationDialog,
    showRenameDialog,
  ]);
}

// Beforeunload handler for unsaved changes
export function useUnsavedChangesWarning() {
  const { hasUnsavedChanges } = useStore();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return event.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);
}
