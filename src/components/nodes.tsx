import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import { type Node, type NodeProps } from "@xyflow/react";

export type TextNodeData = {
  text: string;
};

function TextNode({ data }: NodeProps<Node<TextNodeData>>) {
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>
          <div>Text</div>
          <div>{data.text}</div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export const nodeTypes = {
  textNode: TextNode,
};
