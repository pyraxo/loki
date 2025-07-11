import { NodeProps } from "@xyflow/react";
import { OutputNodeData } from "@/types/nodes";
import { useStore } from "@/lib/store";
import { BaseNode } from "@/components/nodes/BaseNode";
import { Loader2 } from "lucide-react";

// Output Node Class
class OutputNodeClass extends BaseNode<OutputNodeData> {
  protected getNodeIcon(): string {
    return "📄";
  }

  protected getNodeTitle(): string {
    return "Output";
  }

  protected getNodeWidth(): string {
    return "w-96";
  }

  protected getMinHeight(): string {
    return "min-h-[300px]";
  }

  protected renderStatusBadge(): JSX.Element | string {
    return this.data.isStreaming ? (
      <>
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Streaming
      </>
    ) : (
      this.data.status
    );
  }

  protected renderSourceHandle(): JSX.Element | null {
    return null; // Output node doesn't have source handle
  }

  protected renderContent(): JSX.Element {
    return (
      <>
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded min-h-[200px] text-sm">
          {this.data.isStreaming && this.data.streamedContent ? (
            <div className="whitespace-pre-wrap">
              {this.data.streamedContent}
              <span className="animate-pulse">|</span>
            </div>
          ) : this.data.content ? (
            <div className="whitespace-pre-wrap">{this.data.content}</div>
          ) : (
            <div className="text-muted-foreground italic">
              No output yet. Run the workflow to see results.
            </div>
          )}
        </div>

        {this.data.tokenCount &&
          typeof this.data.tokenCount === "number" &&
          !isNaN(this.data.tokenCount) && (
            <div className="mt-2 text-xs text-muted-foreground">
              Tokens: {this.data.tokenCount}
            </div>
          )}

        {this.data.error && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            Error: {this.data.error}
          </div>
        )}
      </>
    );
  }
}

// React Component Wrapper for Output Node
export function OutputNode({ data }: NodeProps) {
  const nodeData = data as OutputNodeData;
  const { updateNodeData } = useStore();

  const nodeInstance = new OutputNodeClass(nodeData, updateNodeData);
  return nodeInstance.render();
}
