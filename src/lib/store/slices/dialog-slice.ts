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

  // Settings dialog actions
  openSettingsDialog: (tab: string = "providers") => {
    set({
      settingsDialog: {
        isOpen: true,
        activeTab: tab,
      },
    });
  },

  closeSettingsDialog: () => {
    set({
      settingsDialog: {
        isOpen: false,
        activeTab: "providers",
      },
    });
  },

  toggleSettingsDialog: () => {
    set({
      settingsDialog: {
        isOpen: !get().settingsDialog.isOpen,
        activeTab: get().settingsDialog.activeTab,
      },
    });
  },
}); 