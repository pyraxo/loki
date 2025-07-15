import { NodeWrapper } from "@/components/nodes/BaseNode";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type OutputNode } from "@/types/nodes";
import { type NodeProps } from "@xyflow/react";

export function OutputNode({ data, selected }: NodeProps<OutputNode>) {
  const displayContent = data.isStreaming
    ? data.streamedContent || ""
    : data.content;

  const hasContent = displayContent && displayContent.trim().length > 0;

  return (
    <NodeWrapper
      data={data}
      icon="📄"
      title="Output"
      minWidth={300}
      minHeight={280}
      hasSourceHandle={false}
      selected={selected}
    >
      <div className="flex flex-col h-full space-y-3">
        {/* Status Badge */}
        {data.isStreaming && (
          <Badge variant="outline" className="w-fit flex-shrink-0">
            Streaming...
          </Badge>
        )}

        {/* Content Display */}
        <div className="flex-1 min-h-0 flex">
          {hasContent ? (
            <ScrollArea className="w-full h-full rounded border bg-muted/50 select-text">
              <div className="p-3 h-full">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {displayContent}
                  {data.isStreaming && (
                    <span className="animate-pulse ml-1">|</span>
                  )}
                </pre>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full w-full rounded border bg-muted/20 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">No output yet</p>
            </div>
          )}
        </div>

        {/* Token Count */}
        {data.tokenCount !== undefined &&
          typeof data.tokenCount === "number" &&
          !isNaN(data.tokenCount) && (
            <div className="flex-shrink-0 flex justify-between items-center text-xs text-muted-foreground">
              <span>Token count: {data.tokenCount}</span>
            </div>
          )}
      </div>
    </NodeWrapper>
  );
}
