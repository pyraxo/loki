import { type Node } from "@xyflow/react";

// Base node data interface
export interface BaseNodeData {
  id: string;
  status: "idle" | "running" | "success" | "error";
  error?: string;
  [key: string]: unknown;
}

// Define specific data types for each node
export type TextPromptNodeData = {
  text: string;
  characterCount?: number;
  history?: TextHistory;
} & BaseNodeData;

// History management for text nodes
export interface TextHistory {
  undoStack: TextHistoryEntry[];
  redoStack: TextHistoryEntry[];
}

// History entry for text nodes
export interface TextHistoryEntry {
  text: string;
  timestamp: number;
}

export type LLMInvocationNodeData = {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
} & BaseNodeData;

export type OutputNodeData = {
  content: string;
  isStreaming: boolean;
  streamedContent?: string;
  tokenCount?: number;
} & BaseNodeData;

export type StartNodeData = {
  workflowName: string;
} & BaseNodeData;

// Node types following React Flow's recommended pattern
export type StartNode = Node<StartNodeData, "start">;
export type TextPromptNode = Node<TextPromptNodeData, "textPrompt">;
export type LLMInvocationNode = Node<LLMInvocationNodeData, "llmInvocation">;
export type OutputNode = Node<OutputNodeData, "textOutput">;

// Union type for all custom nodes
export type CustomNode =
  | StartNode
  | TextPromptNode
  | LLMInvocationNode
  | OutputNode;

// Node types enum
export enum NodeType {
  TEXT_PROMPT = "textPrompt",
  LLM_INVOCATION = "llmInvocation",
  OUTPUT = "textOutput",
  START = "start",
}

// Execution status for workflow
export interface WorkflowState {
  isRunning: boolean;
  currentNode?: string;
  completedNodes: string[];
  errorNodes: string[];
}
