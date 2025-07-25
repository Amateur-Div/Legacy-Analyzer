"use client";

import { useState } from "react";
import { Folder, FileText, ChevronDown, ChevronRight } from "lucide-react";

type FileNode = {
  name: string;
  type: "file" | "folder";
  fullPath?: string;
  children?: FileNode[];
};

function TreeNode({
  node,
  onFileClick,
  depth = 0,
}: {
  node: FileNode;
  onFileClick: (path: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isFolder = node.type === "folder";

  const handleClick = () => {
    if (isFolder) setExpanded((prev) => !prev);
    else if (node.fullPath) onFileClick(node.fullPath);
  };

  return (
    <div className="pl-2">
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent transition-all`}
        style={{ paddingLeft: `${depth * 16 + 8}px ` }}
        onClick={handleClick}
      >
        {isFolder ? (
          expanded ? (
            <ChevronDown size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )
        ) : (
          <FileText size={14} className="text-muted-foreground" />
        )}

        {isFolder && (
          <Folder size={16} className="text-yellow-500 dark:text-yellow-400" />
        )}
        <span
          className={`text-sm truncate ${
            isFolder ? "font-medium text-primary" : "text-muted-foreground"
          }`}
        >
          {node.name}
        </span>
      </div>

      {expanded &&
        node.children?.map((child, i) => (
          <TreeNode
            key={i}
            node={child}
            onFileClick={onFileClick}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

export default function ProjectTree({
  fileTree,
  onFileClick,
}: {
  fileTree: FileNode[];
  onFileClick: (path: string) => void;
}) {
  return (
    <div className="rounded-lg max-h-[600px] overflow-y-auto border bg-background">
      <div className="p-2 space-y-1">
        {fileTree.map((node, i) => (
          <TreeNode key={i} node={node} onFileClick={onFileClick} />
        ))}
      </div>
    </div>
  );
}
