import { useState } from "react";
import {
  MoreHorizontal,
  FileText,
  Clock,
  AlertCircle,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Session, SessionStatus } from "@/types/sessions";
import { useStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";

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
  const { deleteSession, duplicateSession, renameSession, exportSession } =
    useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.RUNNING:
        return <Play className="h-3 w-3" />;
      case SessionStatus.ERROR:
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${session.name}"?`)) {
      await deleteSession(session.id);
    }
    setIsMenuOpen(false);
  };

  const handleDuplicate = async () => {
    await duplicateSession(session.id);
    setIsMenuOpen(false);
  };

  const handleRename = () => {
    const newName = prompt("Enter new session name:", session.name);
    if (newName && newName.trim() !== session.name) {
      renameSession(session.id, newName.trim());
    }
    setIsMenuOpen(false);
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
    setIsMenuOpen(false);
  };

  const formatLastUpdated = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div
      className={`group relative flex items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer ${
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
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
        {getStatusIcon(session.metadata.status) && (
          <div className="absolute -top-1 -right-1">
            {getStatusIcon(session.metadata.status)}
          </div>
        )}
      </div>

      {/* Session Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{session.name}</span>
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
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatLastUpdated(session.updatedAt)}</span>
          </div>
        </div>

        {session.metadata.errorMessage && (
          <div className="text-xs text-red-600 mt-1 truncate">
            Error: {session.metadata.errorMessage}
          </div>
        )}
      </div>

      {/* Context Menu */}
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(true);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleRename}>Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExport}>Export</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-red-600 focus:text-red-600"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
