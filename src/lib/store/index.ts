import { sessionService } from "@/lib/session-service";
import { settingsService } from "@/lib/settings-service";
import { create } from "zustand";
import { createAutoSaveSlice } from "./slices/autosave-slice";
import { createCanvasSlice } from "./slices/canvas-slice";
import { createDialogSlice } from "./slices/dialog-slice";
import { createHistorySlice } from "./slices/history-slice";
import { createSessionSlice } from "./slices/session-slice";
import { createSettingsSlice } from "./slices/settings-slice";
import { createWorkflowSlice } from "./slices/workflow-slice";
import { type StoreState } from "./types";

export const useStore = create<StoreState>((set, get, store) => ({
  // Combine all slices
  ...createCanvasSlice(set, get, store),
  ...createWorkflowSlice(set, get, store),
  ...createSessionSlice(set, get, store),
  ...createSettingsSlice(set, get, store),
  ...createDialogSlice(set, get, store),
  ...createHistorySlice(set, get, store),
  ...createAutoSaveSlice(set, get, store),

  // Store initialization
  initializeStore: async () => {
    set({ isLoading: true, error: null });

    try {
      // Initialize services
      await sessionService.initialize();
      await settingsService.initialize();

      // Load settings
      const settings = await settingsService.loadSettings();
      set({ settings, settingsLoaded: true });

      // Load sessions
      await get().refreshSessions();

      // Create default session if no sessions exist
      const { sessions } = get();
      if (Object.keys(sessions).length === 0) {
        await get().createSession("Example Session");
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initialize store";
      set({ error: errorMessage, isLoading: false });
    }
  },
}));

// Re-export types for convenience
export * from "./types";
export type { StoreState } from "./types";

