import { type CustomNode, type TextPromptNodeData } from "@/types/nodes";
import { type StateCreator } from "zustand";
import { type HistorySlice, type StoreState } from "../types";

export const createHistorySlice: StateCreator<
  StoreState,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  // Text node history management
  addTextHistoryEntry: (nodeId: string, text: string) => {
    try {
      const { nodes } = get();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.type !== "textPrompt") {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[addTextHistoryEntry] Node ${nodeId} not found or not a text prompt`);
        }
        return;
      }
      const textNodeData = node.data as TextPromptNodeData;

      // Initialize history if it doesn't exist
      if (!textNodeData.history) {
        textNodeData.history = {
          undoStack: [],
          redoStack: [],
        };
      }

      const history = textNodeData.history;

      if (!history.undoStack) {
        history.undoStack = [];
      }

      if (!history.redoStack) {
        history.redoStack = [];
      }

      // Add to undo stack
      history.undoStack.push({
        timestamp: Date.now(),
        text,
      });

      // Clear redo stack when new entry is added
      history.redoStack = [];

      // Create properly updated nodes array with immutable updates
      const updatedNodes = nodes.map((n) =>
        n.id === nodeId
          ? {
            ...n,
            data: {
              ...n.data,
              history: {
                ...history,
                undoStack: [...history.undoStack],
                redoStack: [],
              },
            },
          }
          : n
      ) as CustomNode[];

      // Limit history size to prevent memory issues
      if (history.undoStack.length > 100) {
        history.undoStack.shift();
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`[addTextHistoryEntry] Added entry for ${nodeId}, stack size: ${history.undoStack.length}`);
      }
      set({ nodes: updatedNodes });
    } catch (error) {
      console.error(`[addTextHistoryEntry] Error adding history entry for ${nodeId}:`, error);
    }
  },

  undoTextChange: (nodeId: string) => {
    try {
      const { nodes } = get();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.type !== "textPrompt") {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[undoTextChange] Node ${nodeId} not found or not a text prompt`);
        }
        return false;
      }
      const textNodeData = node.data as TextPromptNodeData;
      if (!textNodeData.history || textNodeData.history.undoStack.length === 0) {
        if (process.env.NODE_ENV === "development") {
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
        if (process.env.NODE_ENV === "development") {
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
        if (process.env.NODE_ENV === "development") {
          console.warn(`[redoTextChange] Node ${nodeId} not found or not a text prompt`);
        }
        return false;
      }
      const textNodeData = node.data as TextPromptNodeData;
      if (!textNodeData.history || textNodeData.history.redoStack.length === 0) {
        if (process.env.NODE_ENV === "development") {
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
        if (process.env.NODE_ENV === "development") {
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
        const currentText = textNodeData.text || "";

        // Skip empty or whitespace-only text
        if (currentText.trim() === "") {
          return node;
        }

        // Initialize history if it doesn't exist
        if (!textNodeData.history) {
          textNodeData.history = {
            undoStack: [],
            redoStack: [],
          };
        }

        const history = textNodeData.history;
        console.log(history)

        // Check if current text is different from the most recent history entry
        const lastEntry = history.undoStack[history.undoStack.length - 1];
        if (lastEntry && lastEntry.text === currentText) {
          // No change since last save, skip adding to history
          if (process.env.NODE_ENV === 'development') {
            console.log(`[captureTextHistoryAtSavePoint] Skipping duplicate entry for ${node.id}: "${currentText}"`);
          }
          return node;
        }

        // Add current text to history when saving
        const newUndoStack = [...history.undoStack];
        newUndoStack.push({
          timestamp: Date.now(),
          text: currentText,
        });

        // Limit history size
        if (newUndoStack.length > 100) {
          newUndoStack.shift();
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`[captureTextHistoryAtSavePoint] Added save point for ${node.id}, stack size: ${newUndoStack.length}`);
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
      return node;
    }) as CustomNode[];

    set({ nodes: updatedNodes });
  },
}); 