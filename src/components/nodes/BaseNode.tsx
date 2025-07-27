import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResolvedTheme } from "@/hooks/use-theme-sync";
import { BaseNodeData } from "@/types/nodes";
import { Handle, NodeResizer, Position } from "@xyflow/react";
import { Loader2 } from "lucide-react";

interface NodeWrapperProps {
  data: BaseNodeData;
  children: React.ReactNode;
  icon: string;
  title: string;
  minWidth?: number;
  minHeight?: number;
  hasTargetHandle?: boolean;
  hasSourceHandle?: boolean;
  selected?: boolean;
}

export function NodeWrapper({
  data,
  children,
  icon,
  title,
  minWidth = 80,
  minHeight = 200,
  hasTargetHandle = true,
  hasSourceHandle = true,
  selected = false,
}: NodeWrapperProps) {
  const { resolvedTheme } = useResolvedTheme();

  const getStatusColor = () => {
    switch (data.status) {
      case "running":
        return "border-blue-500";
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      default:
        return "border-gray-300";
    }
  };

  const renderStatusBadge = () => {
    return data.status === "running" ? (
      <>
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Running
      </>
    ) : (
      data.status
    );
  };

  return (
    <Card
      className={`w-full h-full ${getStatusColor()} border-2 cursor-default pt-0 flex flex-col`}
    >
      <NodeResizer
        isVisible={selected}
        color={resolvedTheme === "dark" ? "white" : "black"}
        minWidth={minWidth}
        minHeight={minHeight}
      />
      {hasTargetHandle && <Handle type="target" position={Position.Top} />}

      <CardHeader className="pb-2 pt-6 px-4 cursor-move border-b-1 node-drag flex-shrink-0">
        <CardTitle className="text-sm flex items-center justify-between">
          {icon} {title}
          <Badge variant={data.status === "running" ? "default" : "secondary"}>
            {renderStatusBadge()}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {children}
        {data.error && (
          <div className="mt-2 text-xs text-red-500">Error: {data.error}</div>
        )}
      </CardContent>

      {hasSourceHandle && <Handle type="source" position={Position.Bottom} />}
    </Card>
  );
}
