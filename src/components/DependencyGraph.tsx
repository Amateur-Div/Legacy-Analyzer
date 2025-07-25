"use client";

import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

interface Props {
  nodesData: Node[];
  edgesData: Edge[];
}

export default function DependencyGraph({ nodesData, edgesData }: Props) {
  return (
    <div className="h-[500px] w-full bg-background border rounded-lg">
      <ReactFlow nodes={nodesData} edges={edgesData} fitView>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
