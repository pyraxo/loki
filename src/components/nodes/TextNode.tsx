import { Textarea } from "@/components/ui/textarea";
import { NodeProps } from "@xyflow/react";
import { TextPromptNodeData } from "@/types/nodes";
import { useStore } from "@/lib/store";
import { BaseNode } from "@/components/nodes/BaseNode";
import { useState } from "react";

// Text Prompt Node Class
class TextPromptNodeClass extends BaseNode<TextPromptNodeData> {
  private localText: string;
  private setLocalText: (text: string) => void;

  constructor(
    data: TextPromptNodeData,
    updateNodeData: (id: string, updates: Partial<TextPromptNodeData>) => void,
    localText: string,
    setLocalText: (text: string) => void
  ) {
    super(data, updateNodeData);
    this.localText = localText;
    this.setLocalText = setLocalText;
  }

  protected getNodeIcon(): string {
    return "📝";
  }

  protected getNodeTitle(): string {
    return "Text Prompt";
  }

  protected getNodeWidth(): string {
    return "w-80";
  }

  protected getMinHeight(): string {
    return "min-h-[200px]";
  }

  private handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    this.setLocalText(newText);
    this.updateNodeData(this.data.id, {
      text: newText,
      characterCount: newText.length,
    });
  };

  protected renderContent(): JSX.Element {
    return (
      <>
        <Textarea
          value={this.localText}
          onChange={this.handleTextChange}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Enter your prompt here..."
          className="min-h-[100px] resize-none"
        />
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>{this.data.characterCount || 0} characters</span>
          {this.data.error && (
            <span className="text-red-500">Error: {this.data.error}</span>
          )}
        </div>
      </>
    );
  }
}

// React Component Wrapper for Text Prompt Node
export function TextPromptNode({ data }: NodeProps) {
  const nodeData = data as TextPromptNodeData;
  const { updateNodeData } = useStore();
  const [localText, setLocalText] = useState(nodeData.text);

  const nodeInstance = new TextPromptNodeClass(
    nodeData,
    updateNodeData,
    localText,
    setLocalText
  );

  return nodeInstance.render();
}
