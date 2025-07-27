import { type BaseNodeData, type CustomNode } from "@/types/nodes";
import { NodeType } from "@/types/nodes";
import { type Edge, type Viewport } from "@xyflow/react";
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
  viewport: { x: 0, y: 0, zoom: 1 },
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

  setViewport: (viewport: Viewport) => {
    set({ viewport, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  // Internal setters for React Flow changes (don't mark as unsaved)
  setNodesInternal: (nodes: CustomNode[]) => {
    set({ nodes });
  },

  setEdgesInternal: (edges: Edge[]) => {
    set({ edges });
  },

  setViewportInternal: (viewport: Viewport) => {
    set({ viewport });
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

  duplicateNode: (nodeId: string) => {
    const { nodes } = get();
    const originalNode = nodes.find((node) => node.id === nodeId);
    
    if (!originalNode) {
      return;
    }

    // Generate new unique ID
    const newId = `${originalNode.type}-${Date.now()}`;
    
    // Calculate offset position with collision detection
    const offset = 50;
    let newPosition = {
      x: originalNode.position.x + offset,
      y: originalNode.position.y + offset,
    };

    // Check for collision with existing nodes and adjust position if needed
    const existingPositions = nodes.map(node => ({ x: node.position.x, y: node.position.y }));
    let collision = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (collision && attempts < maxAttempts) {
      collision = existingPositions.some(pos => 
        Math.abs(pos.x - newPosition.x) < 20 && Math.abs(pos.y - newPosition.y) < 20
      );
      
      if (collision) {
        newPosition = {
          x: originalNode.position.x + offset + (attempts * 20),
          y: originalNode.position.y + offset + (attempts * 20),
        };
        attempts++;
      }
    }

    let duplicatedNode: CustomNode;

    // Handle different node types properly
    switch (originalNode.type) {
      case NodeType.START:
        duplicatedNode = {
          ...originalNode,
          id: newId,
          position: newPosition,
          data: {
            ...originalNode.data,
            id: newId,
            status: "idle" as const,
          },
        };
        break;

      case NodeType.TEXT_PROMPT:
        duplicatedNode = {
          ...originalNode,
          id: newId,
          position: newPosition,
          data: {
            ...originalNode.data,
            id: newId,
            status: "idle" as const,
          },
        };
        break;

      case NodeType.LLM_INVOCATION:
        duplicatedNode = {
          ...originalNode,
          id: newId,
          position: newPosition,
          data: {
            ...originalNode.data,
            id: newId,
            status: "idle" as const,
          },
        };
        break;

      case NodeType.OUTPUT:
        duplicatedNode = {
          ...originalNode,
          id: newId,
          position: newPosition,
          data: {
            ...originalNode.data,
            id: newId,
            status: "idle" as const,
            content: "",
            isStreaming: false,
            streamedContent: undefined,
            tokenCount: undefined,
          },
        };
        break;

      default:
        return;
    }

    // Remove any execution-specific error data
    if (duplicatedNode.data.error) {
      duplicatedNode.data.error = undefined;
    }

    // Add the duplicated node to the canvas
    const updatedNodes = [...nodes, duplicatedNode];
    set({ nodes: updatedNodes, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },
}); 