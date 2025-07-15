import { nodeTypes } from "@/components/nodes";
import { initialEdges, initialNodes } from "@/components/nodes/defaults";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useResolvedTheme } from "@/hooks/use-theme-sync";
import { useStore } from "@/lib/store";
import type { CustomNode } from "@/types/nodes";
import { NodeType } from "@/types/nodes";
import {
  Brain,
  FileOutput,
  GitBranch,
  Merge,
  MessageSquare,
  Play,
  Plus,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type ColorMode,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type DefaultEdgeOptions,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CATEGORIES, NODE_TYPES } from "@/components/session/NodeLibrary";

// Add this function before the Canvas component
const getNodeColor = (node: CustomNode) => {
  switch (node.type) {
    case NodeType.START:
      return "#10b981"; // Green for start nodes
    case NodeType.TEXT_PROMPT:
      return "#3b82f6"; // Blue for text prompt nodes
    case NodeType.LLM_INVOCATION:
      return "#8b5cf6"; // Purple for LLM invocation nodes
    case NodeType.OUTPUT:
      return "#f59e0b"; // Orange for output nodes
    default:
      return "#6b7280"; // Gray for any unknown types
  }
};

// Optional: Add stroke color based on node status
const getNodeStrokeColor = (node: CustomNode) => {
  switch (node.data.status) {
    case "running":
      return "#3b82f6"; // Blue border for running nodes
    case "success":
      return "#10b981"; // Green border for successful nodes
    case "error":
      return "#ef4444"; // Red border for error nodes
    default:
      return "#6b7280"; // Gray border for idle nodes
  }
};

const getDefaultEdgeOptions = (isDarkMode: boolean): DefaultEdgeOptions => {
  return {
    // type: "smoothstep",
    animated: false,
    style: {
      stroke: isDarkMode ? "#e5e7eb" : "#6b7280",
      strokeWidth: 2,
    },
    // markerEnd: {
    //   type: MarkerType.ArrowClosed,
    //   color: isDarkMode ? "#e5e7eb" : "#6b7280",
    // },
  };
};

export default function Canvas() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodesInternal,
    setEdgesInternal,
    activeSessionId,
    isLoading,
    createSession,
    loadSession,
  } = useStore();
  const { resolvedTheme } = useResolvedTheme();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Convert theme to React Flow ColorMode
  const colorMode: ColorMode = resolvedTheme === "dark" ? "dark" : "light";
  const isDarkMode = resolvedTheme === "dark";

  // Get default edge options based on theme
  const defaultEdgeOptions = getDefaultEdgeOptions(isDarkMode);

  // Initialize with demo nodes if empty (only on first mount, not during session loading)
  useEffect(() => {
    // Only initialize if there are no nodes, no active session, and not currently loading
    if (nodes.length === 0 && !activeSessionId && !isLoading) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [nodes.length, activeSessionId, isLoading, setNodes, setEdges]);

  // Node creation logic (from NodeCreationMenu)
  const createNode = useCallback(
    (type: NodeType, event?: React.MouseEvent) => {
      const newId = `${type}-${Date.now()}`;

      // Calculate position - use context menu event position if available
      let position = { x: 100, y: 100 }; // Default position
      if (event) {
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (canvasRect) {
          position = {
            x: event.clientX - canvasRect.left - 100,
            y: event.clientY - canvasRect.top - 50,
          };
        }
      } else {
        // For keyboard shortcuts, create nodes in center of canvas
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (canvasRect) {
          position = {
            x: canvasRect.width / 2 - 100,
            y: canvasRect.height / 2 - 50,
          };
        }
      }

      let newNode: CustomNode;

      switch (type) {
        case NodeType.START:
          newNode = {
            id: newId,
            position,
            data: {
              id: newId,
              workflowName: "New Workflow",
              status: "idle" as const,
            },
            width: 240,
            height: 240,
            type,
            dragHandle: ".node-drag",
          } as CustomNode;
          break;
        case NodeType.TEXT_PROMPT:
          newNode = {
            id: newId,
            position,
            data: {
              id: newId,
              text: "",
              status: "idle" as const,
              characterCount: 0,
            },
            width: 240,
            height: 240,
            type,
            dragHandle: ".node-drag",
          } as CustomNode;
          break;
        case NodeType.LLM_INVOCATION:
          newNode = {
            id: newId,
            position,
            data: {
              id: newId,
              model: "gpt-4o" as const,
              temperature: 0.7,
              maxTokens: 150,
              status: "idle" as const,
            },
            width: 300,
            height: 320,
            type,
            dragHandle: ".node-drag",
          } as CustomNode;
          break;
        case NodeType.OUTPUT:
          newNode = {
            id: newId,
            position,
            data: {
              id: newId,
              content: "",
              isStreaming: false,
              status: "idle" as const,
            },
            width: 300,
            height: 280,
            type,
            dragHandle: ".node-drag",
          } as CustomNode;
          break;
        default:
          return;
      }

      setNodes([...nodes, newNode]);
    },
    [nodes, setNodes]
  );

  // Delete selected nodes and edges
  const deleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    const selectedEdges = edges.filter((edge) => edge.selected);

    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      const remainingNodes = nodes.filter((node) => !node.selected);
      const remainingEdges = edges.filter((edge) => !edge.selected);

      setNodes(remainingNodes);
      setEdges(remainingEdges);
    }
  }, [nodes, edges, setNodes, setEdges]);

  // Global keyboard shortcuts for canvas
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Delete selected nodes/edges
      if (event.key === "Delete" || event.key === "Backspace") {
        // Only handle if focus is on canvas or no specific input is focused
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            (activeElement as HTMLElement).contentEditable === "true");

        if (!isInputFocused) {
          event.preventDefault();
          deleteSelected();
        }
      }
    };

    // Add event listener to document for global shortcuts
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [createNode, deleteSelected]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes) as CustomNode[];

      // Check if this is a user action (like dragging/removing) or just selection/internal changes
      const hasUserChanges = changes.some(
        (change) => change.type === "position" || change.type === "remove"
      );

      if (hasUserChanges) {
        setNodes(updatedNodes); // Mark as unsaved for user changes
      } else {
        setNodesInternal(updatedNodes); // Don't mark as unsaved for selection changes
      }
    },
    [nodes, setNodes, setNodesInternal]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges);

      // Check if this is a user action (like removing) or just selection/internal changes
      const hasUserChanges = changes.some((change) => change.type === "remove");

      if (hasUserChanges) {
        setEdges(updatedEdges); // Mark as unsaved for user changes
      } else {
        setEdgesInternal(updatedEdges); // Don't mark as unsaved for selection changes
      }
    },
    [edges, setEdges, setEdgesInternal]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = addEdge(params, edges);
      setEdges(newEdge);
    },
    [edges, setEdges]
  );

  // Handle creating a new session and loading it
  const handleCreateSession = async () => {
    try {
      const sessionId = await createSession();
      await loadSession(sessionId);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  // If no session is selected, show placeholder
  if (!activeSessionId && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full pb-16 pl-16">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">no session selected</h2>
            <p className="text-muted-foreground text-sm">
              select a session from the sidebar to start building your workflow,
              or create a new one to get started.
            </p>
          </div>
          <Button onClick={handleCreateSession} className="gap-2">
            <Plus className="w-4 h-4" />
            create new session
          </Button>
        </div>
      </div>
    );
  }

  // Group nodes by category for context menu
  const nodesByCategory = CATEGORIES.map((category) => ({
    ...category,
    nodes: NODE_TYPES.filter((node) => node.category === category.name),
  })).filter((category) => category.nodes.length > 0);

  return (
    <div ref={canvasRef} className="relative w-full h-full">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              colorMode={colorMode}
              proOptions={{ hideAttribution: true }}
              fitView
              defaultEdgeOptions={defaultEdgeOptions}
            >
              <Controls />
              <MiniMap
                zoomable
                pannable
                nodeStrokeWidth={3}
                nodeColor={getNodeColor}
                nodeStrokeColor={getNodeStrokeColor}
              />
              <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {nodesByCategory.map((category, categoryIndex) => (
            <div key={category.name}>
              {categoryIndex > 0 && <ContextMenuSeparator />}
              <ContextMenuLabel>{category.name}</ContextMenuLabel>
              {category.nodes.map((nodeType) => {
                const Icon = nodeType.icon;
                return (
                  <ContextMenuItem
                    key={nodeType.type}
                    disabled={nodeType.disabled}
                    onClick={(event) =>
                      !nodeType.disabled && createNode(nodeType.type, event)
                    }
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{nodeType.name}</span>
                    {nodeType.shortcut && (
                      <ContextMenuShortcut>
                        {nodeType.shortcut}
                      </ContextMenuShortcut>
                    )}
                  </ContextMenuItem>
                );
              })}
            </div>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
