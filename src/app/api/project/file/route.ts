import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const filePath = searchParams.get("filePath");

    if (!projectId || !filePath) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const absolutePath = path.join(
      process.cwd(),
      "project_uploads",
      projectId,
      filePath
    );
    const content = fs.readFileSync(absolutePath, "utf-8");

    return NextResponse.json({ content });
  } catch (err) {
    console.error("FILE_READ_ERROR", err);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
