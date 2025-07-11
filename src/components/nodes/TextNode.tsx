import { Textarea } from "@/components/ui/textarea";
import { type NodeProps } from "@xyflow/react";
import { type TextPromptNode } from "@/types/nodes";
import { useStore } from "@/lib/store";
import { NodeWrapper } from "@/components/nodes/BaseNode";
import { useState } from "react";

export function TextPromptNode({ data, id }: NodeProps<TextPromptNode>) {
  const { updateNodeData } = useStore();
  const [localText, setLocalText] = useState(data.text);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setLocalText(newText);
    updateNodeData(id, {
      text: newText,
      characterCount: newText.length,
    });
  };

  return (
    <NodeWrapper
      data={data}
      icon="📝"
      title="Text Prompt"
      width="w-80"
      minHeight="min-h-[200px]"
    >
      <div className="space-y-3">
        <Textarea
          value={localText}
          onChange={handleTextChange}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Enter your prompt here..."
          className="min-h-[100px] resize-none"
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{data.characterCount || 0} characters</span>
        </div>
      </div>
    </NodeWrapper>
  );
}
