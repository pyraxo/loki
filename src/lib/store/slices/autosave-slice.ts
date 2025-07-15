import { type StateCreator } from "zustand";
import { type AutoSaveSlice, type StoreState } from "../types";

export const createAutoSaveSlice: StateCreator<
  StoreState,
  [],
  [],
  AutoSaveSlice
> = (set, get) => ({
  // Initial state
  autoSaveEnabled: true,

  // Auto-save
  enableAutoSave: () => {
    set({ autoSaveEnabled: true });
  },

  disableAutoSave: () => {
    set({ autoSaveEnabled: false });
  },

  triggerAutoSave: async () => {
    const { autoSaveEnabled, hasUnsavedChanges, activeSessionId } = get();

    if (autoSaveEnabled && hasUnsavedChanges && activeSessionId) {
      try {
        await get().saveSession();
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }
  },
}); 