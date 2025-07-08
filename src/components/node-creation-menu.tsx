import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NodeType } from "@/types/nodes";
import { useStore } from "@/lib/store";

interface NodeCreationMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  isVisible: boolean;
}

export function NodeCreationMenu({
  position,
  onClose,
  isVisible,
}: NodeCreationMenuProps) {
  const { nodes, setNodes } = useStore();

  const createNode = (type: NodeType) => {
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

    const newNode = {
      id: newId,
      position: { x: position.x - 100, y: position.y - 50 },
      data: nodeData,
      type,
    };

    setNodes([...nodes, newNode]);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <Card
      className="absolute z-50 w-48 shadow-lg border-2"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -10px)",
      }}
    >
      <CardContent className="p-2 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs"
          onClick={() => createNode(NodeType.START)}
        >
          🚀 Start Node
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs"
          onClick={() => createNode(NodeType.TEXT_PROMPT)}
        >
          📝 Text Prompt
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs"
          onClick={() => createNode(NodeType.LLM_INVOCATION)}
        >
          🤖 LLM Invocation
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs"
          onClick={() => createNode(NodeType.OUTPUT)}
        >
          📄 Output
        </Button>
      </CardContent>
    </Card>
  );
}
