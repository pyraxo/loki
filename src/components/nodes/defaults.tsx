import { CustomNode, NodeType } from "@/types/nodes";

// Initial demo nodes
export const initialNodes: CustomNode[] = [
  {
    id: "start-1",
    position: { x: 50, y: 50 },
    data: {
      id: "start-1",
      workflowName: "Demo Workflow",
      status: "idle" as const,
    },
    width: 240,
    height: 240,
    type: NodeType.START,
    dragHandle: ".node-drag",
  } as CustomNode,
  {
    id: "text-1",
    position: { x: 50, y: 400 },
    data: {
      id: "text-1",
      text: "Write a short poem about coding",
      status: "idle" as const,
      characterCount: 32,
    },
    width: 240,
    height: 240,
    type: NodeType.TEXT_PROMPT,
    dragHandle: ".node-drag",
  } as CustomNode,
  {
    id: "llm-1",
    position: { x: 50, y: 800 },
    data: {
      id: "llm-1",
      model: "gpt-4o" as const,
      temperature: 0.7,
      maxTokens: 150,
      status: "idle" as const,
    },
    width: 300,
    height: 320,
    type: NodeType.LLM_INVOCATION,
    dragHandle: ".node-drag",
  } as CustomNode,
  {
    id: "output-1",
    position: { x: 450, y: 400 },
    data: {
      id: "output-1",
      content: "",
      isStreaming: false,
      status: "idle" as const,
    },
    width: 300,
    height: 280,
    type: NodeType.OUTPUT,
    dragHandle: ".node-drag",
  } as CustomNode,
];

export const initialEdges = [
  { id: "e-start-text", source: "start-1", target: "text-1" },
  { id: "e-text-llm", source: "text-1", target: "llm-1" },
  { id: "e-llm-output", source: "llm-1", target: "output-1" },
];
