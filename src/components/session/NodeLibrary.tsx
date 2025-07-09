import {
  Play,
  MessageSquare,
  Brain,
  FileOutput,
  GitBranch,
  Timer,
  Merge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NodeType } from "@/types/nodes";

interface NodeTypeInfo {
  type: NodeType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  badge?: string;
}

const NODE_TYPES: NodeTypeInfo[] = [
  {
    type: NodeType.START,
    name: "Start",
    description: "Begin workflow execution",
    icon: Play,
    category: "Control",
    badge: "Essential",
  },
  {
    type: NodeType.TEXT_PROMPT,
    name: "Text Prompt",
    description: "Input text content or prompts",
    icon: MessageSquare,
    category: "Input",
  },
  {
    type: NodeType.LLM_INVOCATION,
    name: "LLM Call",
    description: "Send prompt to language model",
    icon: Brain,
    category: "AI",
  },
  {
    type: NodeType.OUTPUT,
    name: "Output",
    description: "Display or export results",
    icon: FileOutput,
    category: "Output",
  },
  // Future node types
  {
    type: "CONDITIONAL" as NodeType,
    name: "Conditional",
    description: "Branch workflow based on conditions",
    icon: GitBranch,
    category: "Control",
    badge: "Coming Soon",
  },
  {
    type: "DELAY" as NodeType,
    name: "Delay",
    description: "Add time delay between operations",
    icon: Timer,
    category: "Utility",
    badge: "Coming Soon",
  },
  {
    type: "MERGE" as NodeType,
    name: "Merge",
    description: "Combine multiple inputs",
    icon: Merge,
    category: "Utility",
    badge: "Coming Soon",
  },
];

const CATEGORIES = [
  { name: "Control", description: "Workflow control nodes" },
  { name: "Input", description: "Data input nodes" },
  { name: "AI", description: "AI processing nodes" },
  { name: "Output", description: "Result output nodes" },
  { name: "Utility", description: "Helper utility nodes" },
];

interface NodeItemProps {
  nodeType: NodeTypeInfo;
}

function NodeItem({ nodeType }: NodeItemProps) {
  const Icon = nodeType.icon;
  const isDisabled = nodeType.badge === "Coming Soon";

  const handleDragStart = (e: React.DragEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        nodeType: nodeType.type,
        name: nodeType.name,
      })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable={!isDisabled}
      onDragStart={handleDragStart}
      className={`group relative flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer border ${
        isDisabled
          ? "border-dashed border-muted opacity-50 cursor-not-allowed"
          : "border-transparent hover:bg-muted/50 hover:border-border"
      }`}
    >
      <div
        className={`flex-shrink-0 p-2 rounded-md ${
          isDisabled ? "bg-muted" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{nodeType.name}</span>
          {nodeType.badge && (
            <Badge
              variant={nodeType.badge === "Essential" ? "default" : "secondary"}
              className="text-xs"
            >
              {nodeType.badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{nodeType.description}</p>
      </div>

      {!isDisabled && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground">
          Drag
        </div>
      )}
    </div>
  );
}

export default function NodeLibrary() {
  const nodesByCategory = CATEGORIES.map((category) => ({
    ...category,
    nodes: NODE_TYPES.filter((node) => node.category === category.name),
  })).filter((category) => category.nodes.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-1">Node Library</h2>
        <p className="text-sm text-muted-foreground">
          Drag nodes to the canvas to build your workflow
        </p>
      </div>

      {/* Node Categories */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {nodesByCategory.map((category) => (
            <div key={category.name}>
              <div className="mb-3">
                <h3 className="font-medium text-sm text-foreground mb-1">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {category.description}
                </p>
              </div>

              <div className="space-y-1">
                {category.nodes.map((nodeType) => (
                  <NodeItem key={nodeType.type} nodeType={nodeType} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground text-center">
          <p className="mb-1">
            Available:{" "}
            {NODE_TYPES.filter((n) => !n.badge?.includes("Coming")).length}{" "}
            nodes
          </p>
          <p>
            Coming soon:{" "}
            {NODE_TYPES.filter((n) => n.badge?.includes("Coming")).length} more
          </p>
        </div>
      </div>
    </div>
  );
}
