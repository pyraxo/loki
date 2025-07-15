import { type CustomNode } from "@/types/nodes";
import { type Session } from "@/types/sessions";

/**
 * Utility function to safely find a node by ID
 */
export const findNodeById = (nodes: CustomNode[], nodeId: string): CustomNode | undefined => {
  return nodes.find((node) => node.id === nodeId);
};

/**
 * Utility function to check if a node exists and is of a specific type
 */
export const isNodeOfType = (nodes: CustomNode[], nodeId: string, nodeType: string): boolean => {
  const node = findNodeById(nodes, nodeId);
  return node ? node.type === nodeType : false;
};

/**
 * Utility function to get all nodes of a specific type
 */
export const getNodesByType = (nodes: CustomNode[], nodeType: string): CustomNode[] => {
  return nodes.filter((node) => node.type === nodeType);
};

/**
 * Utility function to safely update a node in the nodes array
 */
export const updateNodeInArray = (
  nodes: CustomNode[],
  nodeId: string,
  updateFn: (node: CustomNode) => CustomNode
): CustomNode[] => {
  return nodes.map((node) => (node.id === nodeId ? updateFn(node) : node));
};

/**
 * Utility function to get session metadata summary
 */
export const getSessionSummary = (session: Session) => {
  return {
    id: session.id,
    name: session.name,
    status: session.metadata.status,
    nodeCount: session.metadata.nodeCount,
    hasUnsavedChanges: session.metadata.hasUnsavedChanges,
    lastModified: session.updatedAt,
  };
};

/**
 * Utility function to check if a session has unsaved changes
 */
export const hasUnsavedChanges = (session: Session): boolean => {
  return session.metadata.hasUnsavedChanges;
};

/**
 * Utility function to get all sessions with unsaved changes
 */
export const getUnsavedSessions = (sessions: Record<string, Session>): Session[] => {
  return Object.values(sessions).filter(hasUnsavedChanges);
};

/**
 * Utility function to sort sessions by last modified date
 */
export const sortSessionsByDate = (sessions: Session[], ascending: boolean = false): Session[] => {
  return [...sessions].sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Utility function to validate session data
 */
export const isValidSession = (session: any): session is Session => {
  return (
    session &&
    typeof session.id === 'string' &&
    typeof session.name === 'string' &&
    Array.isArray(session.nodes) &&
    Array.isArray(session.edges) &&
    session.metadata &&
    typeof session.createdAt === 'string' &&
    typeof session.updatedAt === 'string'
  );
};

/**
 * Utility function to get the display name for a node
 */
export const getNodeDisplayName = (node: CustomNode): string => {
  const nodeType = node.type as string;
  switch (nodeType) {
    case 'start':
      return 'Start';
    case 'textPrompt':
      return 'text' in node.data ? ((node.data.text as string)?.substring(0, 30) || 'Text Prompt') : 'Text Prompt';
    case 'llmInvocation':
      return 'model' in node.data ? `LLM (${node.data.model})` : 'LLM';
    case 'textOutput':
      return 'Output';
    default:
      return nodeType;
  }
};

/**
 * Utility function to calculate workflow progress
 */
export const calculateWorkflowProgress = (
  totalNodes: number,
  completedNodes: number,
  errorNodes: number
): {
  percentage: number;
  status: 'idle' | 'running' | 'completed' | 'error';
} => {
  if (totalNodes === 0) {
    return { percentage: 0, status: 'idle' };
  }

  const processedNodes = completedNodes + errorNodes;
  const percentage = (processedNodes / totalNodes) * 100;

  if (errorNodes > 0) {
    return { percentage, status: 'error' };
  }

  if (completedNodes === totalNodes) {
    return { percentage: 100, status: 'completed' };
  }

  if (processedNodes > 0) {
    return { percentage, status: 'running' };
  }

  return { percentage: 0, status: 'idle' };
};

/**
 * Utility function to debounce function calls
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}; 