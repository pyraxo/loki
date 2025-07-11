import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { BaseNodeData } from "@/types/nodes";

interface NodeWrapperProps {
  data: BaseNodeData;
  children: React.ReactNode;
  icon: string;
  title: string;
  width?: string;
  minHeight?: string;
  hasTargetHandle?: boolean;
  hasSourceHandle?: boolean;
}

export function NodeWrapper({
  data,
  children,
  icon,
  title,
  width = "w-80",
  minHeight = "min-h-[200px]",
  hasTargetHandle = true,
  hasSourceHandle = true,
}: NodeWrapperProps) {
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
      className={`${width} ${minHeight} ${getStatusColor()} border-2 cursor-default pt-0`}
    >
      {hasTargetHandle && <Handle type="target" position={Position.Top} />}

      <CardHeader className="pb-2 pt-6 px-4 cursor-move border-b-1 rounded-t-lg node-drag">
        <CardTitle className="text-sm flex items-center justify-between">
          {icon} {title}
          <Badge variant={data.status === "running" ? "default" : "secondary"}>
            {renderStatusBadge()}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {children}
        {data.error && (
          <div className="mt-2 text-xs text-red-500">Error: {data.error}</div>
        )}
      </CardContent>

      {hasSourceHandle && <Handle type="source" position={Position.Bottom} />}
    </Card>
  );
}
