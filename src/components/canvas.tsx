import { useCallback, useRef, useEffect } from "react";
import { nodeTypes } from "@/components/nodes";
import { useStore } from "@/lib/store";
import { NodeType } from "@/types/nodes";
import {
  Play,
  MessageSquare,
  Brain,
  FileOutput,
  GitBranch,
  Timer,
  Merge,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Node types structure from NodeLibrary
const NODE_TYPES = [
  {
    type: NodeType.START,
    name: "Start",
    description: "Begin workflow execution",
    icon: Play,
    category: "Control",
    badge: "Essential",
    shortcut: "⌘1",
  },
  {
    type: NodeType.TEXT_PROMPT,
    name: "Text Prompt",
    description: "Input text content or prompts",
    icon: MessageSquare,
    category: "Input",
    shortcut: "⌘2",
  },
  {
    type: NodeType.LLM_INVOCATION,
    name: "LLM Call",
    description: "Send prompt to language model",
    icon: Brain,
    category: "AI",
    shortcut: "⌘3",
  },
  {
    type: NodeType.OUTPUT,
    name: "Output",
    description: "Display or export results",
    icon: FileOutput,
    category: "Output",
    shortcut: "⌘4",
  },
  // Future node types (disabled)
  {
    type: "CONDITIONAL" as NodeType,
    name: "Conditional",
    description: "Branch workflow based on conditions",
    icon: GitBranch,
    category: "Control",
    badge: "Coming Soon",
    disabled: true,
  },
  {
    type: "DELAY" as NodeType,
    name: "Delay",
    description: "Add time delay between operations",
    icon: Timer,
    category: "Utility",
    badge: "Coming Soon",
    disabled: true,
  },
  {
    type: "MERGE" as NodeType,
    name: "Merge",
    description: "Combine multiple inputs",
    icon: Merge,
    category: "Utility",
    badge: "Coming Soon",
    disabled: true,
  },
];

const CATEGORIES = [
  { name: "Control", description: "Workflow control nodes" },
  { name: "Input", description: "Data input nodes" },
  { name: "AI", description: "AI processing nodes" },
  { name: "Output", description: "Result output nodes" },
  { name: "Utility", description: "Helper utility nodes" },
];

// Initial demo nodes
const initialNodes = [
  {
    id: "start-1",
    position: { x: 50, y: 50 },
    data: {
      id: "start-1",
      workflowName: "Demo Workflow",
      status: "idle" as const,
    },
    type: NodeType.START,
    dragHandle: ".node-drag",
  },
  {
    id: "text-1",
    position: { x: 50, y: 400 },
    data: {
      id: "text-1",
      text: "Write a short poem about coding",
      status: "idle" as const,
      characterCount: 32,
    },
    type: NodeType.TEXT_PROMPT,
    dragHandle: ".node-drag",
  },
  {
    id: "llm-1",
    position: { x: 50, y: 800 },
    data: {
      id: "llm-1",
      model: "gpt-3.5-turbo" as const,
      temperature: 0.7,
      maxTokens: 150,
      status: "idle" as const,
    },
    type: NodeType.LLM_INVOCATION,
    dragHandle: ".node-drag",
  },
  {
    id: "output-1",
    position: { x: 450, y: 400 },
    data: {
      id: "output-1",
      content: "",
      isStreaming: false,
      status: "idle" as const,
    },
    type: NodeType.OUTPUT,
    dragHandle: ".node-drag",
  },
];

const initialEdges = [
  { id: "e-start-text", source: "start-1", target: "text-1" },
  { id: "e-text-llm", source: "text-1", target: "llm-1" },
  { id: "e-llm-output", source: "llm-1", target: "output-1" },
];

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
  } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);

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

      let nodeData;
      switch (type) {
        case NodeType.START:
          nodeData = {
            id: newId,
            workflowName: "New Workflow",
            status: "idle" as const,
          };
          break;
        case NodeType.TEXT_PROMPT:
          nodeData = {
            id: newId,
            text: "",
            status: "idle" as const,
            characterCount: 0,
          };
          break;
        case NodeType.LLM_INVOCATION:
          nodeData = {
            id: newId,
            model: "gpt-3.5-turbo" as const,
            temperature: 0.7,
            maxTokens: 150,
            status: "idle" as const,
          };
          break;
        case NodeType.OUTPUT:
          nodeData = {
            id: newId,
            content: "",
            isStreaming: false,
            status: "idle" as const,
          };
          break;
        default:
          return;
      }

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

      const newNode = {
        id: newId,
        position,
        data: nodeData,
        type,
      };

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

      // Node creation shortcuts
      if (isCtrlOrCmd && event.key >= "1" && event.key <= "4") {
        event.preventDefault();
        switch (event.key) {
          case "1":
            createNode(NodeType.START);
            break;
          case "2":
            createNode(NodeType.TEXT_PROMPT);
            break;
          case "3":
            createNode(NodeType.LLM_INVOCATION);
            break;
          case "4":
            createNode(NodeType.OUTPUT);
            break;
        }
      }

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
      // Apply changes to nodes while preserving our custom data
      const updatedNodes = changes.reduce((acc, change) => {
        if (change.type === "position" && change.position) {
          return acc.map((node) =>
            node.id === change.id
              ? { ...node, position: change.position! }
              : node
          );
        }
        if (change.type === "select") {
          return acc.map((node) =>
            node.id === change.id
              ? { ...node, selected: change.selected }
              : node
          );
        }
        if (change.type === "remove") {
          return acc.filter((node) => node.id !== change.id);
        }
        return acc;
      }, nodes);

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
      const updatedEdges = changes.reduce((acc, change) => {
        if (change.type === "select") {
          return acc.map((edge) =>
            edge.id === change.id
              ? { ...edge, selected: change.selected }
              : edge
          );
        }
        if (change.type === "remove") {
          return acc.filter((edge) => edge.id !== change.id);
        }
        return acc;
      }, edges);

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
              proOptions={{ hideAttribution: true }}
              fitView
            >
              <Controls />
              <MiniMap />
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
