import { useEffect } from "react";
import { Plus, Upload, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/lib/store";
import SessionItem from "./SessionItem";
import SessionSearch from "./SessionSearch";

export default function SessionList() {
  const {
    sessions,
    activeSessionId,
    filteredSessionIds,
    isLoading,
    error,
    createSession,
    loadSession,
    importSession,
    exportAllSessions,
    refreshSessions,
    initializeStore,
  } = useStore();

  // Initialize store on mount
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const handleCreateSession = async () => {
    try {
      const sessionId = await createSession();
      await loadSession(sessionId);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleImportSession = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const sessionId = await importSession(text);
          if (sessionId) {
            await loadSession(sessionId);
          }
        } catch (error) {
          console.error("Failed to import session:", error);
        }
      }
    };
    input.click();
  };

  const handleExportAll = async () => {
    try {
      const exportData = await exportAllSessions();
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loki-sessions-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export sessions:", error);
    }
  };

  const handleSessionClick = async (sessionId: string) => {
    if (sessionId !== activeSessionId) {
      try {
        await loadSession(sessionId);
      } catch (error) {
        console.error("Failed to load session:", error);
      }
    }
  };

  const displayedSessions = filteredSessionIds
    .map((id) => sessions[id])
    .filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Sessions</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImportSession}
              disabled={isLoading}
              title="Import Session"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportAll}
              disabled={isLoading || Object.keys(sessions).length === 0}
              title="Export All Sessions"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateSession}
              disabled={isLoading}
              title="New Session"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <SessionSearch />
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={refreshSessions}>
              Retry
            </Button>
          </div>
        ) : displayedSessions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {Object.keys(sessions).length === 0 ? (
              <div>
                <p className="text-sm mb-2">No sessions yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateSession}
                >
                  Create your first session
                </Button>
              </div>
            ) : (
              <p className="text-sm">No sessions match your search</p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {displayedSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onClick={() => handleSessionClick(session.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer */}
      {displayedSessions.length > 0 && (
        <div className="p-2 border-t text-xs text-muted-foreground text-center">
          {displayedSessions.length} of {Object.keys(sessions).length} sessions
        </div>
      )}
    </div>
  );
}
