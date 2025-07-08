import { type Node } from "@xyflow/react";

// Base node data interface
export interface BaseNodeData {
  id: string;
  status: 'idle' | 'running' | 'success' | 'error';
  error?: string;
  [key: string]: unknown;
}

// Text Prompt Node
export interface TextPromptNodeData extends BaseNodeData {
  text: string;
  characterCount?: number;
}

// LLM Invocation Node
export interface LLMInvocationNodeData extends BaseNodeData {
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-haiku' | 'claude-3-sonnet';
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

// Output/Viewer Node
export interface OutputNodeData extends BaseNodeData {
  content: string;
  isStreaming: boolean;
  streamedContent?: string;
  tokenCount?: number;
}

// Start Node
export interface StartNodeData extends BaseNodeData {
  workflowName: string;
}

// Union type for all node data
export type NodeData = 
  | TextPromptNodeData 
  | LLMInvocationNodeData 
  | OutputNodeData 
  | StartNodeData;

// Extended Node type with our data
export type CustomNode = Node<NodeData>;

// Node types enum
export enum NodeType {
  TEXT_PROMPT = 'textPrompt',
  LLM_INVOCATION = 'llmInvocation', 
  OUTPUT = 'textOutput',
  START = 'start'
}

// Execution status for workflow
export interface WorkflowState {
  isRunning: boolean;
  currentNode?: string;
  completedNodes: string[];
  errorNodes: string[];
} 