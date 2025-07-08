import { create } from "zustand";
import { type Edge } from "@xyflow/react";
import {
  type CustomNode,
  type WorkflowState,
  type NodeData,
} from "@/types/nodes";

interface CanvasState {
  // React Flow state
  nodes: CustomNode[];
  edges: Edge[];

  // Workflow execution state
  workflow: WorkflowState;

  // Actions
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  updateNodeStatus: (
    nodeId: string,
    status: "idle" | "running" | "success" | "error",
    error?: string
  ) => void;

  // Workflow actions
  startWorkflow: () => void;
  stopWorkflow: () => void;
  markNodeCompleted: (nodeId: string) => void;
  markNodeError: (nodeId: string, error: string) => void;
  resetWorkflow: () => void;
}

export const useStore = create<CanvasState>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  workflow: {
    isRunning: false,
    currentNode: undefined,
    completedNodes: [],
    errorNodes: [],
  },

  // Actions
  setNodes: (nodes: CustomNode[]) => set({ nodes }),
  setEdges: (edges: Edge[]) => set({ edges }),

  updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
    const { nodes } = get();
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    );
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
    );
    set({ nodes: updatedNodes });
  },

  // Workflow actions
  startWorkflow: () => {
    set({
      workflow: {
        isRunning: true,
        currentNode: undefined,
        completedNodes: [],
        errorNodes: [],
      },
    });
  },

  stopWorkflow: () => {
    const { workflow } = get();
    set({
      workflow: {
        ...workflow,
        isRunning: false,
        currentNode: undefined,
      },
    });
  },

  markNodeCompleted: (nodeId: string) => {
    const { workflow } = get();
    set({
      workflow: {
        ...workflow,
        completedNodes: [...workflow.completedNodes, nodeId],
        currentNode: undefined,
      },
    });
  },

  markNodeError: (nodeId: string, error: string) => {
    const { workflow, nodes } = get();

    // Update workflow state
    set({
      workflow: {
        ...workflow,
        errorNodes: [...workflow.errorNodes, nodeId],
        currentNode: undefined,
        isRunning: false,
      },
    });

    // Update node status
    get().updateNodeStatus(nodeId, "error", error);
  },

  resetWorkflow: () => {
    set({
      workflow: {
        isRunning: false,
        currentNode: undefined,
        completedNodes: [],
        errorNodes: [],
      },
    });

    // Reset all node statuses to idle
    const { nodes } = get();
    const resetNodes = nodes.map((node) => ({
      ...node,
      data: { ...node.data, status: "idle" as const, error: undefined },
    }));
    set({ nodes: resetNodes });
  },
}));
