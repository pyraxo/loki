import { type CustomNode } from "@/types/nodes";
import { SessionStatus } from "@/types/sessions";
import { type StateCreator } from "zustand";
import { type StoreState, type WorkflowSlice } from "../types";

export const createWorkflowSlice: StateCreator<
  StoreState,
  [],
  [],
  WorkflowSlice
> = (set, get) => ({
  // Initial state
  workflow: {
    isRunning: false,
    currentNode: undefined,
    completedNodes: [],
    errorNodes: [],
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
    get().markSessionAsRunning();
  },

  stopWorkflow: () => {
    const { workflow, activeSessionId } = get();

    // Only proceed if workflow is actually running
    if (!workflow.isRunning) {
      return;
    }

    set({
      workflow: {
        ...workflow,
        isRunning: false,
        currentNode: undefined,
      },
    });

    // If workflow is being stopped manually and session isn't already in error state,
    // mark as saved (assuming no unsaved changes from the workflow execution itself)
    if (activeSessionId) {
      const hasErrors = workflow.errorNodes.length > 0;
      if (!hasErrors) {
        get().updateSessionMetadata(
          activeSessionId,
          {
            isRunning: false,
            status: SessionStatus.SAVED,
          },
          false
        );
      } else {
        // Just mark as not running if there were errors (status already set to ERROR)
        get().updateSessionMetadata(
          activeSessionId,
          { isRunning: false },
          false
        );
      }
    }
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

    // Check if this completed the entire workflow
    get().checkWorkflowCompletion();
  },

  markNodeError: (nodeId: string, error: string) => {
    const { workflow } = get();

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

    // Mark session as error
    const { activeSessionId } = get();
    if (activeSessionId) {
      get().markSessionAsError(activeSessionId, error);
    }
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
    })) as CustomNode[];
    set({ nodes: resetNodes, hasUnsavedChanges: true });
    get().markSessionAsUnsaved();
  },

  // Helper method to check if workflow is completed
  checkWorkflowCompletion: () => {
    const { workflow, nodes, activeSessionId } = get();

    if (!workflow.isRunning || !activeSessionId) {
      return;
    }

    // Get all nodes that should be executed
    const executableNodes = nodes.filter((_: CustomNode) => {
      // All nodes are considered executable in this implementation
      return true;
    });

    const totalExecutableNodes = executableNodes.length;
    const completedNodesCount = workflow.completedNodes.length;
    const errorNodesCount = workflow.errorNodes.length;

    // Check if all nodes are either completed or errored
    const allNodesProcessed =
      completedNodesCount + errorNodesCount >= totalExecutableNodes;

    if (allNodesProcessed) {
      // Stop the workflow state
      set({
        workflow: {
          ...workflow,
          isRunning: false,
          currentNode: undefined,
        },
      });

      // If there are no error nodes, mark as completed successfully
      if (errorNodesCount === 0) {
        get().markSessionAsCompleted(activeSessionId);
      }
      // If there are error nodes, the session should already be marked as error by markNodeError
    }
  },
}); 