import { NodeType } from "@/types/nodes";
import { StartNode } from "@/components/nodes/StartNode";
import { TextPromptNode } from "@/components/nodes/TextNode";
import { LLMInvocationNode } from "@/components/nodes/LLMNode";
import { OutputNode } from "@/components/nodes/OutputNode";

export const nodeTypes = {
  [NodeType.START]: StartNode,
  [NodeType.TEXT_PROMPT]: TextPromptNode,
  [NodeType.LLM_INVOCATION]: LLMInvocationNode,
  [NodeType.OUTPUT]: OutputNode,
};
