import { NodeWrapper } from "@/components/nodes/BaseNode";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { type TextPromptNode } from "@/types/nodes";
import { type NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";

export function TextPromptNode({
  data,
  id,
  selected,
}: NodeProps<TextPromptNode>) {
  const { updateNodeData } = useStore();
  const [localText, setLocalText] = useState(data.text);

  // Sync local state with store data when it changes
  useEffect(() => {
    setLocalText(data.text);
  }, [data.text]);

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
      <div className="space-y-3 flex-1 min-h-0 flex flex-col">
        <Textarea
          value={localText}
          onChange={handleTextChange}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Enter your prompt here..."
          className="min-h-[100px] resize-none select-text flex-1"
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{data.characterCount || 0} characters</span>
        </div>
      </div>
    </NodeWrapper>
  );
}
