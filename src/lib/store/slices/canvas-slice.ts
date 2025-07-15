import { type BaseNodeData, type CustomNode } from "@/types/nodes";
import { type Edge } from "@xyflow/react";
import { type StateCreator } from "zustand";
import { type CanvasSlice, type StoreState } from "../types";

export const createCanvasSlice: StateCreator<
  StoreState,
  [],
  [],
  CanvasSlice
> = (set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  hasUnsavedChanges: false,

  // Canvas actions
  setNodes: (nodes: CustomNode[]) => {
    set({ nodes, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  setEdges: (edges: Edge[]) => {
    set({ edges, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  // Internal setters for React Flow changes (don't mark as unsaved)
  setNodesInternal: (nodes: CustomNode[]) => {
    set({ nodes });
  },

  setEdgesInternal: (edges: Edge[]) => {
    set({ edges });
  },

  updateNodeData: (
    nodeId: string,
    data: Partial<BaseNodeData & Record<string, any>>
  ) => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ) as CustomNode[];
    set({ nodes: updatedNodes, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  updateNodeDataDuringExecution: (
    nodeId: string,
    data: Partial<BaseNodeData & Record<string, any>>
  ) => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ) as CustomNode[];
    set({ nodes: updatedNodes });
  },

  updateNodeStatus: (
    nodeId: string,
    status: "idle" | "running" | "success" | "error",
    error?: string
  ) => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, status, error } }
        : node
    ) as CustomNode[];
    set({ nodes: updatedNodes });
  },
}); 