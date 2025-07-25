import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import clientPromise from "@/lib/mongoClient";

export async function POST(req: NextRequest) {
  try {
    const { projectId, query } = await req.json();

    if (!query || !projectId) {
      return NextResponse.json(
        { error: "Missing query or projectId" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db();
    const project = await db.collection("projects").findOne({ projectId });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const matches: any[] = [];

    const walkTree = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === "file" && node.fullPath) {
          const absPath = path.join(
            process.cwd(),
            "project_uploads",
            projectId,
            node.fullPath
          );

          try {
            const content = fs.readFileSync(absPath, "utf-8");

            const lines = content.split("\n");
            lines.forEach((line, idx) => {
              if (line.toLowerCase().includes(query.toLowerCase())) {
                matches.push({
                  path: node.fullPath,
                  line: idx + 1,
                  snippet: line.trim(),
                });
              }
            });
          } catch (e) {
            console.warn("Failed to read file:", node.fullPath);
          }
        } else if (node.children) {
          walkTree(node.children);
        }
      }
    };

    walkTree(project.fileTree);

    return NextResponse.json({ results: matches });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
