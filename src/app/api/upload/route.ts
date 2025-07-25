import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";
import AdmZip from "adm-zip";
import { globSync } from "glob";

import { authMiddleware } from "@/lib/auth-server";
import clientPromise from "@/lib/mongoClient";

import * as babelParser from "@babel/parser";
import { extractImportsBabel } from "../lib/extractImportsBabel";
import { extractSymbolsBabel } from "../lib/extractSymbolsBabel";

function extractHighlights(code: string): {
  todos: string[];
  fixmes: string[];
  notes: string[];
} {
  const ast = babelParser.parse(code, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
    attachComment: true,
  });

  const todos: string[] = [];
  const fixmes: string[] = [];
  const notes: string[] = [];

  const comments = (ast.comments || []).map((c) => c.value.trim());

  comments.forEach((comment) => {
    const content = comment.toLowerCase();
    if (content.includes("todo")) todos.push(comment);
    if (content.includes("fixme")) fixmes.push(comment);
    if (content.includes("note")) notes.push(comment);
  });

  return { todos, fixmes, notes };
}

function isEntryFile(name: string, content: string): boolean {
  const lower = name.toLowerCase();

  const likelyNames = [
    "index.js",
    "index.ts",
    "main.js",
    "main.ts",
    "app.js",
    "app.ts",
    "cli.js",
    "cli.ts",
    "server.js",
    "server.ts",
  ];

  const bootKeywords = [
    "listen(",
    "createRoot(",
    "ReactDOM.render(",
    "process.argv",
    "app.use(",
    "render(",
    "nextApp.prepare(",
  ];

  if (likelyNames.includes(lower)) return true;

  return bootKeywords.some((kw) => content.includes(kw));
}

function detectTags(packageInfo: any, fileTree: any[]): string[] {
  const tags = new Set<string>();

  const deps = Object.keys({
    ...packageInfo?.dependencies,
    ...packageInfo?.devDependencies,
  });

  const allFilenames: string[] = [];

  const walk = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.type === "file") {
        allFilenames.push(node.name.toLowerCase());
        if (node.fullPath?.endsWith(".ts") || node.fullPath?.endsWith(".tsx")) {
          tags.add("typescript");
        }
      } else if (node.children) {
        walk(node.children);
      }
    }
  };

  walk(fileTree);

  const techKeywords: Record<string, string[]> = {
    react: ["react", "react-dom"],
    nextjs: ["next"],
    express: ["express"],
    tailwind: ["tailwindcss", "tailwind.config.js"],
    typescript: ["typescript", ".ts", ".tsx"],
    prisma: ["prisma", "prisma/schema.prisma"],
    firebase: ["firebase", "firebase-admin", "firebaseConfig"],
    eslint: ["eslint", ".eslintrc", "@eslint"],
    mongodb: ["mongodb", "mongoose", "mongoClient"],
  };

  for (const [tag, matchers] of Object.entries(techKeywords)) {
    for (const keyword of matchers) {
      const kw = keyword.toLowerCase();

      if (deps.some((d) => d.toLowerCase().includes(kw))) {
        tags.add(tag);
        break;
      }

      if (allFilenames.some((f) => f.includes(kw))) {
        tags.add(tag);
        break;
      }
    }
  }

  return Array.from(tags);
}

function buildFileTree(files: string[], rootDir: string) {
  const tree: any[] = [];

  for (const file of files) {
    const relativePath = file.replace(rootDir + "/", "");
    const parts = relativePath.split("/");

    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const existing = current.find((item) => item.name === part);

      if (existing) {
        current = existing.children!;
      } else {
        const isFile = i === parts.length - 1;
        const fullPath = parts.slice(0, i + 1).join("/");

        let size = undefined;
        let loc = undefined;
        let functions: string[] = [];
        let classes: string[] = [];
        let components: string[] = [];
        let exports: string[] = [];
        let imports: string[] = [];
        let highlights;
        let entry;

        if (isFile) {
          const absolutePath = path.join(rootDir, fullPath);

          try {
            const stats = fs.statSync(absolutePath);
            size = stats.size;

            const content = fs.readFileSync(absolutePath, "utf-8");
            loc = content.split("\n").length;

            entry = isEntryFile(file, content);

            const ext = part.split(".").pop()?.toLowerCase();
            if (["js", "ts", "jsx", "tsx"].includes(ext || "")) {
              try {
                highlights = extractHighlights(content);
                imports = extractImportsBabel(content);
                const symbols = extractSymbolsBabel(content);
                functions = symbols.functions;
                classes = symbols.classes;
                components = symbols.components;
                exports = symbols.exports;
              } catch (error) {
                console.log("AST error : ", error);
              }
            }
          } catch (err) {
            console.warn("Failed to read file:", fullPath);
          }
        }

        const newItem = {
          name: part,
          type: isFile ? "file" : "folder",
          fullPath: isFile ? fullPath : undefined,
          size,
          loc,
          imports,
          highlights,
          functions,
          classes,
          components,
          exports,
          entry,
          children: isFile ? undefined : [],
        };

        current.push(newItem);
        if (!isFile) {
          current = newItem.children!;
        }
      }
    }
  }

  return tree;
}

function detectPackageManager(dir: string): string {
  if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(dir, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(dir, "package-lock.json"))) return "npm";
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const { uid } = await authMiddleware(token);

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || file.type !== "application/x-zip-compressed") {
      return NextResponse.json({ error: "Invalid ZIP file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    fs.mkdirSync(path.join(process.cwd(), "project_uploads"), {
      recursive: true,
    });

    const projectId = uuid();
    const zipPath = path.join(
      process.cwd(),
      "project_uploads",
      `${projectId}.zip`
    );
    const extractPath = path.join(process.cwd(), "project_uploads", projectId);

    fs.writeFileSync(zipPath, buffer);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    const packageJsonMatches = globSync(`${extractPath}/**/package.json`, {
      nodir: true,
    });

    let packageInfo: any = null;

    if (packageJsonMatches.length > 0) {
      const packageJsonPath = packageJsonMatches[0];
      try {
        const content = fs.readFileSync(packageJsonPath, "utf-8");
        const parsed = JSON.parse(content);

        packageInfo = {
          name: parsed.name,
          version: parsed.version,
          scripts: parsed.scripts || {},
          dependencies: parsed.dependencies || {},
          devDependencies: parsed.devDependencies || {},
          manager: detectPackageManager(path.dirname(packageJsonPath)),
          path: packageJsonPath.replace(extractPath + "/", ""),
        };
      } catch (err) {
        console.warn("Failed to parse package.json:", err);
      }
    }

    const walk = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(fullPath));
        } else {
          results.push(path.relative(extractPath, fullPath));
        }
      });
      return results;
    };

    const allFiles = walk(extractPath);
    const fileTree = buildFileTree(allFiles, extractPath);

    const entryPoints: string[] = [];

    const walkTree = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === "file" && node.entry) {
          entryPoints.push(node.fullPath);
        } else if (node.children) {
          walkTree(node.children);
        }
      }
    };

    walkTree(fileTree);

    const mongoClient = await clientPromise;
    const db = mongoClient.db();
    const projectName = file.name.replace(/\.zip$/, "");

    let totalFiles = 0;
    let totalFolders = 0;
    const langMap: Record<string, number> = {};

    const countStats = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === "file") {
          totalFiles++;
          const ext = node.name.split(".").pop()?.toLowerCase();
          if (ext) langMap[ext] = (langMap[ext] || 0) + 1;
        } else if (node.type === "folder" && node.children) {
          totalFolders++;
          countStats(node.children);
        }
      }
    };

    countStats(fileTree);

    const tags = detectTags(packageInfo, fileTree);

    await db.collection("projects").insertOne({
      userId: uid,
      projectName,
      createdAt: new Date(),
      fileTree,
      projectId,
      stats: {
        totalFiles,
        totalFolders,
        topLanguages: Object.entries(langMap)
          .sort((a, b) => b[1] - a[1])
          .map(([ext, count]) => ({ ext, count }))
          .slice(0, 5),
      },
      packageInfo: packageInfo,
      entryPoints,
      tags,
    });

    return NextResponse.json({ message: "Project saved", projectName });
  } catch (err) {
    console.error("[UPLOAD_ERROR]", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
