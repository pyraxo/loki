import { NodeWrapper } from "@/components/nodes/BaseNode";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { type TextPromptNode } from "@/types/nodes";
import { type NodeProps } from "@xyflow/react";
import { useState } from "react";

export function TextPromptNode({
  data,
  id,
  selected,
}: NodeProps<TextPromptNode>) {
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
      minWidth={240}
      minHeight={240}
      selected={selected}
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
