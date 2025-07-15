import { NodeWrapper } from "@/components/nodes/BaseNode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type OutputNode } from "@/types/nodes";
import { type NodeProps } from "@xyflow/react";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function OutputNode({ data, selected }: NodeProps<OutputNode>) {
  const [isCopied, setIsCopied] = useState(false);

  const displayContent = data.isStreaming
    ? data.streamedContent || ""
    : data.content;

  const hasContent = displayContent && displayContent.trim().length > 0;

  const handleCopy = async () => {
    if (!hasContent) return;

    try {
      await navigator.clipboard.writeText(displayContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

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
        <div className="flex-1 min-h-0 flex relative">
          {hasContent ? (
            <>
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

              {/* Copy Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 opacity-70 hover:opacity-100 transition-opacity"
                onClick={handleCopy}
                disabled={!hasContent}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </>
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
