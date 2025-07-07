import { create } from "zustand";

export const useStore = create((set) => ({
  nodes: [],
  setNodes: (nodes: Node[]) => set({ nodes }),
}));