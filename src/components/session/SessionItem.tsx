import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { type Session, SessionStatus } from "@/types/sessions";
import { formatDistanceToNow } from "date-fns";
import { Clock, FileText } from "lucide-react";
import { useState } from "react";

interface SessionItemProps {
  session: Session;
  isActive?: boolean;
  onClick?: () => void;
}

export default function SessionItem({
  session,
  isActive = false,
  onClick,
}: SessionItemProps) {
  const {
    deleteSession,
    duplicateSession,
    renameSession,
    exportSession,
    showRenameDialog,
    showConfirmationDialog,
  } = useStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.SAVED:
        return "bg-green-500";
      case SessionStatus.UNSAVED:
        return "bg-yellow-500";
      case SessionStatus.RUNNING:
        return "bg-blue-500 animate-pulse";
      case SessionStatus.ERROR:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const confirmDelete = async () => {
    showConfirmationDialog(
      "Delete Session",
      `Are you sure you want to delete "${session.name}"? This action cannot be undone.`,
      () => deleteSession(session.id),
      "Delete"
    );
  };

  const handleDuplicate = async () => {
    await duplicateSession(session.id);
  };

  const handleRename = () => {
    showRenameDialog("Rename Session", session.name, (newName: string) =>
      renameSession(session.id, newName)
    );
  };

  const handleExport = async () => {
    try {
      const exportData = await exportSession(session.id);
      if (exportData) {
        const blob = new Blob([exportData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${session.name}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );

      if (diffInMinutes < 1) return "now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {session.metadata && (
            <div
              className={`group relative flex items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted/50"
              }`}
              onClick={onClick}
            >
              {/* Status Indicator */}
              <div className="relative flex-shrink-0">
                <div
                  className={`h-2 w-2 rounded-full ${getStatusColor(
                    session.metadata.status
                  )}`}
                />
              </div>

              {/* Session Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {session.name}
                  </span>
                  {session.metadata.hasUnsavedChanges && (
                    <Badge variant="secondary" className="text-xs">
                      Unsaved
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{session.metadata.nodeCount} nodes</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {formatLastUpdated(session.updatedAt)}
                    </span>
                  </div>
                </div>

                {session.metadata.errorMessage && (
                  <div className="text-xs text-red-600 mt-1 truncate">
                    Error:{" "}
                    {session.metadata.errorMessage.length > 20
                      ? session.metadata.errorMessage.slice(0, 20) + "..."
                      : session.metadata.errorMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleRename}>
            <span>Rename</span>
            <ContextMenuShortcut>F2</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDuplicate}>
            <span>Duplicate</span>
            <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={handleExport}>
            <span>Export</span>
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={confirmDelete}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <span>Delete</span>
            <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{session.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
