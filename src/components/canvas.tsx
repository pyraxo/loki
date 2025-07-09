import { useCallback, useState, useRef } from "react";
import { nodeTypes } from "@/components/nodes";
import { NodeCreationMenu } from "@/components/node-creation-menu";
import { useStore } from "@/lib/store";
import { NodeType } from "@/types/nodes";

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
  const { nodes, edges, setNodes, setEdges } = useStore();
  const [menuState, setMenuState] = useState({
    isVisible: false,
    position: { x: 0, y: 0 },
  });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize with demo nodes if empty
  if (nodes.length === 0) {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }

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

      setNodes(updatedNodes);
    },
    [nodes, setNodes]
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

      setEdges(updatedEdges);
    },
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = addEdge(params, edges);
      setEdges(newEdge);
    },
    [edges, setEdges]
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      setMenuState({
        isVisible: true,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setMenuState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const closeMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <div ref={canvasRef} className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      <NodeCreationMenu
        position={menuState.position}
        isVisible={menuState.isVisible}
        onClose={closeMenu}
      />
    </div>
  );
}
