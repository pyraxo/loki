import { NodeWrapper } from "@/components/nodes/BaseNode";
import { Textarea } from "@/components/ui/textarea";
import { useTextHistory } from "@/hooks/use-text-history";
import { useStore } from "@/lib/store";
import { type TextPromptNode } from "@/types/nodes";
import { type NodeProps } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

export function TextPromptNode({
  data,
  id,
  selected,
}: NodeProps<TextPromptNode>) {
  const { updateNodeData } = useStore();
  const [localText, setLocalText] = useState(data.text);
  const previousTextRef = useRef(data.text);
  const isUpdatingFromStore = useRef(false);
  // Note: We only use keyboard shortcuts from useTextHistory, not addHistoryEntry
  useTextHistory(id, selected || false);

  // Sync local state with store data when it changes
  useEffect(() => {
    // Only update if the text actually changed and we're not in the middle of updating from store
    if (data.text !== localText && !isUpdatingFromStore.current) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[TextNode ${id}] Syncing from store:`, {
          storeText: data.text,
          localText: localText,
          previousText: previousTextRef.current,
        });
      }

      isUpdatingFromStore.current = true;
      setLocalText(data.text);
      previousTextRef.current = data.text;

      // Reset the flag after the update
      setTimeout(() => {
        isUpdatingFromStore.current = false;
      }, 0);
    }
  }, [data.text, localText, id]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;

    // Don't process changes if we're updating from store
    if (isUpdatingFromStore.current) {
      return;
    }

    setLocalText(newText);

    updateNodeData(id, {
      text: newText,
      characterCount: newText.length,
    });

    previousTextRef.current = newText;
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
          {selected && (
            <span className="text-xs opacity-70">
              Ctrl/Cmd+Z: undo to save point • Ctrl/Cmd+Shift+Z: redo
            </span>
          )}
        </div>
      </div>
    </NodeWrapper>
  );
}
