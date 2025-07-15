import { useStore } from "@/lib/store";
import { useCallback, useEffect } from "react";

export function useTextHistory(nodeId: string, isSelected: boolean) {
  const { undoTextChange, redoTextChange } = useStore();

  const handleUndo = useCallback(() => {
    return undoTextChange(nodeId);
  }, [nodeId, undoTextChange]);

  const handleRedo = useCallback(() => {
    return redoTextChange(nodeId);
  }, [nodeId, redoTextChange]);

  useEffect(() => {
    if (!isSelected) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Only handle keyboard events when the node is selected
      // but not when textarea is focused (to avoid interfering with native undo/redo)
      const activeElement = document.activeElement;
      const isTextareaFocused = activeElement && activeElement.tagName === "TEXTAREA";

      if (isCtrlOrCmd && !isTextareaFocused) {
        if (event.key === "z" && !event.shiftKey) {
          // Undo (Ctrl/Cmd+Z)
          event.preventDefault();
          event.stopPropagation();
          const undoSuccess = handleUndo();
          if (process.env.NODE_ENV === 'development') {
            console.log("Undo applied:", undoSuccess);
          }
        } else if (event.key === "z" && event.shiftKey) {
          // Redo (Ctrl/Cmd+Shift+Z)
          event.preventDefault();
          event.stopPropagation();
          const redoSuccess = handleRedo();
          if (process.env.NODE_ENV === 'development') {
            console.log("Redo applied:", redoSuccess);
          }
        } else if (event.key === "y" && !event.shiftKey) {
          // Alternative redo shortcut (Ctrl/Cmd+Y)
          event.preventDefault();
          event.stopPropagation();
          const redoSuccess = handleRedo();
          if (process.env.NODE_ENV === 'development') {
            console.log("Redo applied:", redoSuccess);
          }
        }
      }
    };

    // Add event listener to document for global shortcuts
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSelected, handleUndo, handleRedo]);

  // Only return the handlers, no addHistoryEntry needed
  return {
    handleUndo,
    handleRedo,
  };
} 