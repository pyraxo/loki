import { invoke } from "@tauri-apps/api/core";
import { type StateCreator } from "zustand";
import { type DialogSlice, type StoreState } from "../types";

export const createDialogSlice: StateCreator<
  StoreState,
  [],
  [],
  DialogSlice
> = (set, get) => ({
  // Initial state
  confirmationDialog: {
    isOpen: false,
    title: "",
    description: "",
    onConfirm: null,
    confirmText: "Delete",
  },

  renameDialog: {
    isOpen: false,
    title: "",
    currentValue: "",
    onConfirm: null,
  },

  settingsDialog: {
    isOpen: false,
    activeTab: "providers",
  },

  // Confirmation dialog
  showConfirmationDialog: (
    title: string,
    description: string,
    onConfirm: () => void,
    confirmText?: string
  ) => {
    set({
      confirmationDialog: {
        isOpen: true,
        title,
        description,
        onConfirm,
        confirmText,
      },
    });
  },

  hideConfirmationDialog: () => {
    set({
      confirmationDialog: {
        isOpen: false,
        title: "",
        description: "",
        onConfirm: null,
      },
    });
  },

  // Rename dialog
  showRenameDialog: (
    title: string,
    currentValue: string,
    onConfirm: (newName: string) => void
  ) => {
    set({
      renameDialog: {
        isOpen: true,
        title,
        currentValue,
        onConfirm,
      },
    });
  },

  hideRenameDialog: () => {
    set({
      renameDialog: {
        isOpen: false,
        title: "",
        currentValue: "",
        onConfirm: null,
      },
    });
  },

  // Settings dialog actions - now using Rust-based dialog
  openSettingsDialog: async (tab: string = "providers") => {
    try {
      await invoke("open_settings_dialog");
      // Keep the local state for backward compatibility
      set({
        settingsDialog: {
          isOpen: true,
          activeTab: tab,
        },
      });
    } catch (error) {
      console.error("Failed to open settings dialog:", error);
    }
  },

  closeSettingsDialog: async () => {
    try {
      await invoke("close_settings_dialog");
      set({
        settingsDialog: {
          isOpen: false,
          activeTab: "providers",
        },
      });
    } catch (error) {
      console.error("Failed to close settings dialog:", error);
    }
  },

  toggleSettingsDialog: async () => {
    const { settingsDialog } = get();
    if (settingsDialog.isOpen) {
      await get().closeSettingsDialog();
    } else {
      await get().openSettingsDialog();
    }
  },
}); 