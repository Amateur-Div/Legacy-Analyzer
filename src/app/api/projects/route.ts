import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth-server";
import clientPromise from "@/lib/mongoClient";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    const { uid } = await authMiddleware(token);

    const client = await clientPromise;
    const db = client.db();

    const projects = await db
      .collection("projects")
      .find({ userId: uid })
      .sort({ createdAt: -1 })
      .project({ projectName: 1, createdAt: 1 })
      .toArray();

    return NextResponse.json({
      projects: projects.map((p) => ({
        _id: p._id.toString(),
        projectName: p.projectName,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error("PROJECT_FETCH_ERROR", err);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
