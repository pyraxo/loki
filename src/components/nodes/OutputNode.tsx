import { type NodeProps } from "@xyflow/react";
import { type OutputNode } from "@/types/nodes";
import { NodeWrapper } from "@/components/nodes/BaseNode";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OutputNode({ data }: NodeProps<OutputNode>) {
  const displayContent = data.isStreaming
    ? data.streamedContent || ""
    : data.content;

  const hasContent = displayContent && displayContent.trim().length > 0;

  return (
    <NodeWrapper
      data={data}
      icon="📄"
      title="Output"
      width="w-96"
      minHeight="min-h-[280px]"
      hasSourceHandle={false}
    >
      <div className="space-y-3">
        {/* Status Badge */}
        {data.isStreaming && (
          <Badge variant="outline" className="w-fit">
            Streaming...
          </Badge>
        )}

        {/* Content Display */}
        <div className="min-h-[150px]">
          {hasContent ? (
            <ScrollArea className="h-[150px] w-full rounded border bg-muted/50 p-3">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {displayContent}
              </pre>
              {data.isStreaming && <span className="animate-pulse">|</span>}
            </ScrollArea>
          ) : (
            <div className="h-[150px] w-full rounded border bg-muted/20 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">No output yet</p>
            </div>
          )}
        </div>

        {/* Token Count */}
        {data.tokenCount !== undefined &&
          typeof data.tokenCount === "number" &&
          !isNaN(data.tokenCount) && (
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Token count: {data.tokenCount}</span>
            </div>
          )}
      </div>
    </NodeWrapper>
  );
}
