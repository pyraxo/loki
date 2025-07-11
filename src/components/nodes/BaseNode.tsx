import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { Card } from "@/components/ui/card";

// Base Node Class
export abstract class BaseNode<T = any> {
  protected data: T;
  protected updateNodeData: (id: string, updates: Partial<T>) => void;

  constructor(
    data: T,
    updateNodeData: (id: string, updates: Partial<T>) => void
  ) {
    this.data = data;
    this.updateNodeData = updateNodeData;
  }

  // Abstract methods that child classes must implement
  protected abstract getNodeIcon(): string;
  protected abstract getNodeTitle(): string;
  protected abstract renderContent(): JSX.Element;
  protected abstract getNodeWidth(): string;
  protected abstract getMinHeight(): string;

  // Common styling methods
  protected getStatusColor(): string {
    switch ((this.data as any).status) {
      case "running":
        return "border-blue-500";
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      default:
        return "border-gray-300";
    }
  }

  protected getHeaderBg(): string {
    switch ((this.data as any).status) {
      case "running":
        return "bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200";
      case "success":
        return "bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200";
      case "error":
        return "bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200";
      default:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200";
    }
  }

  // Common header rendering
  protected renderHeader(): JSX.Element {
    const nodeData = this.data as any;
    return (
      <CardHeader
        className={`pb-2 pt-6 px-4 cursor-move border-b-1 rounded-t-lg node-drag`}
      >
        <CardTitle className="text-sm flex items-center justify-between">
          {this.getNodeIcon()} {this.getNodeTitle()}
          <Badge
            variant={nodeData.status === "running" ? "default" : "secondary"}
          >
            {this.renderStatusBadge()}
          </Badge>
        </CardTitle>
      </CardHeader>
    );
  }

  // Status badge rendering (can be overridden)
  protected renderStatusBadge(): JSX.Element | string {
    const nodeData = this.data as any;
    return nodeData.status === "running" ? (
      <>
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Running
      </>
    ) : (
      nodeData.status
    );
  }

  // Handle rendering methods
  protected renderTargetHandle(): JSX.Element | null {
    return <Handle type="target" position={Position.Top} />;
  }

  protected renderSourceHandle(): JSX.Element | null {
    return <Handle type="source" position={Position.Bottom} />;
  }

  // Main render method
  public render(): JSX.Element {
    return (
      <Card
        className={`${this.getNodeWidth()} ${this.getMinHeight()} ${this.getStatusColor()} border-2 cursor-default pt-0`}
      >
        {this.renderTargetHandle()}
        {this.renderHeader()}
        <CardContent>{this.renderContent()}</CardContent>
        {this.renderSourceHandle()}
      </Card>
    );
  }
}
