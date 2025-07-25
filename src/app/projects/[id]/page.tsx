"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProjectTree from "@/components/ProjectTree";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Trash } from "lucide-react";
import { getAuth } from "firebase/auth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import path from "path";
import DependencyGraph from "@/components/DependencyGraph";

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id: projectId } = useParams() as { id: string };

  const [project, setProject] = useState<any>(null);
  const [fileContent, setFileContent] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(project?.projectName || "");
  const [projectData, setProjectData] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[] | []>([]);
  const [insights, setInsights] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fileSearchTerm, setFileSearchTerm] = useState("");
  const [matchIndices, setMatchIndices] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [readmeSummary, setReadmeSummary] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/project?id=${projectId}`);
      const data = await res.json();
      if (data) {
        setProjectData(true);
      }

      setProject(data);

      console.log(data);
    };
    load();
  }, [projectId]);

  useEffect(() => {
    const getReadMeData = async () => {
      let readmePath;
      if (projectData) {
        readmePath = findReadmePath(project.fileTree);
        const insights = calculateInsights(project.fileTree);
        setInsights(insights);
        setTags(project.tags);
      }

      if (readmePath) {
        const contentRes = await fetch(
          `/api/project/file?projectId=${
            project?.projectId
          }&filePath=${encodeURIComponent(readmePath)}`
        );
        const contentData = await contentRes.json();
        setReadmeContent(contentData.content);
      }
    };
    getReadMeData();
  }, [projectData, project]);

  useEffect(() => {
    if (!project) return;

    const readmeNode = project.fileTree.find(
      (file: any) => file.name.toLowerCase() === "readme.md"
    );

    if (readmeNode) {
      fetch(
        `/api/project/file?projectId=${project.projectId}&filePath=${readmeNode.fullPath}`
      )
        .then((res) => res.text())
        .then((content) => {
          setReadmeContent(content);
          setReadmeSummary(generateSummary(content));
        });
    }
  }, [project]);

  const { html, indices } = highlightMatchesWithIndex(
    fileContent,
    fileSearchTerm
  );
  useEffect(() => {
    setMatchIndices(indices);
    setCurrentMatchIndex(0);
  }, [fileSearchTerm, fileContent]);

  useEffect(() => {
    if (matchIndices.length > 0) {
      const el = document.querySelector(
        `[data-match-index="${currentMatchIndex}"]`
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentMatchIndex, matchIndices]);

  function generateSummary(md: string): string {
    const lines = md.split("\n").filter(Boolean);
    const firstLines = lines.slice(0, 5);

    return (
      firstLines
        .map((line) => line.replace(/^#+\s*/, "").trim())
        .join(" ")
        .slice(0, 300) + "..."
    );
  }

  function findReadmePath(tree: any[]): string | null {
    for (const node of tree) {
      if (node.type === "file" && node.name.toLowerCase() === "\\readme.md") {
        return node.fullPath;
      } else if (node.type === "folder" && node.children) {
        const found = findReadmePath(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  function buildDependencyGraph(tree: any[]): {
    nodes: string[];
    edges: [string, string][];
  } {
    const nodes: string[] = [];
    const edges: [string, string][] = [];

    const walk = (nodeList: any[], base = "") => {
      for (const node of nodeList) {
        if (node.type === "file") {
          const fullPath = node.fullPath;
          nodes.push(fullPath);

          for (const imp of node.imports || []) {
            if (imp.startsWith(".")) {
              const resolvedPath = path
                .join(path.dirname(fullPath), imp)
                .replace(/\\/g, "/");
              edges.push([fullPath, resolvedPath]);
            }
          }
        } else if (node.children) {
          walk(node.children, base);
        }
      }
    };

    walk(tree);
    return { nodes, edges };
  }

  const graph = project && buildDependencyGraph(project.fileTree);

  const nodesData = graph?.nodes.map((id: any) => ({
    id,
    data: { label: id.split("/").pop() },
    position: { x: Math.random() * 600, y: Math.random() * 600 },
    type: "default",
  }));

  const edgesData = graph?.edges.map(([from, to]: any, i: any) => ({
    id: `e${i}`,
    source: from,
    target: to,
    type: "smoothstep",
  }));

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );
    if (!confirmDelete) return;

    const token = await getAuth().currentUser?.getIdToken();
    const res = await fetch(`/api/project?id=${projectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      toast.success("Project deleted successfully");
      router.push("/projects");
    } else {
      toast.error("Failed to delete project");
    }
  };

  const handleFileClick = async (path: string) => {
    setSelectedPath(path);
    const res = await fetch(
      `/api/project/file?projectId=${
        project.projectId
      }&filePath=${encodeURIComponent(path)}`
    );
    const data = await res.json();
    setFileContent(data.content || "Unable to load file.");
  };

  const handleRename = async () => {
    setEditingName(false);
    if (!newName || newName === project.projectName) return;

    const token = await getAuth().currentUser?.getIdToken();
    const res = await fetch("/api/project", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: project._id, newName }),
    });

    if (res.ok) {
      setProject({ ...project, projectName: newName });
      toast.success("Project renamed!");
    }
  };

  function calculateInsights(tree: any[]) {
    let totalLOC = 0;
    let totalFiles = 0;
    let totalFolders = 0;
    let largestFile = { name: "", loc: 0 };
    const languageMap: Record<string, number> = {};

    const walk = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === "file") {
          totalFiles++;
          totalLOC += node.loc || 0;

          const ext = node.name.split(".").pop()?.toLowerCase();
          if (ext) languageMap[ext] = (languageMap[ext] || 0) + (node.loc || 0);

          if ((node.loc || 0) > largestFile.loc) {
            largestFile = { name: node.name, loc: node.loc };
          }
        } else if (node.type === "folder" && node.children) {
          totalFolders++;
          walk(node.children);
        }
      }
    };

    walk(tree);

    const sortedLangs = Object.entries(languageMap)
      .sort((a, b) => b[1] - a[1])
      .map(([ext, loc]) => ({ ext, loc }));

    return {
      totalLOC,
      totalFiles,
      totalFolders,
      largestFile,
      topLanguages: sortedLangs,
      languageUsage: sortedLangs.map(({ ext, loc }) => ({
        ext,
        loc,
        percent: ((loc / totalLOC) * 100).toFixed(1),
      })),
    };
  }

  function escapeHTML(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, (char) => {
      const escapeMap: { [key: string]: string } = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return escapeMap[char];
    });
  }

  function highlightMatchesWithIndex(code: string, query: string) {
    if (!query) return { html: escapeHTML(code), indices: [] };

    const escaped = escapeHTML(code);
    const regex = new RegExp(`(${query})`, "gi");

    const indices: number[] = [];
    let matchIndex = 0;

    const highlighted = escaped.replace(regex, (match) => {
      indices.push(matchIndex++);
      return `<mark class="bg-yellow-300" data-match-index="${
        matchIndex - 1
      }">${match}</mark>`;
    });

    return { html: highlighted, indices };
  }

  function detectLanguage(filePath: string = "") {
    const ext = filePath.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "html":
        return "html";
      case "css":
        return "css";
      case "json":
        return "json";
      case "md":
        return "markdown";
      case "py":
        return "python";
      case "java":
        return "java";
      case "cpp":
        return "cpp";
      default:
        return "text";
    }
  }

  function filterFileTree(tree: any[], query: string): any[] {
    if (!query) return tree;

    const matchesQuery = (name: string) =>
      name.toLowerCase().includes(query.toLowerCase());

    return tree
      .map((node) => {
        if (node.type === "file" && matchesQuery(node.name)) {
          return node;
        }
        if (node.type === "folder" && node.children) {
          const filteredChildren = filterFileTree(node.children, query);
          if (filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
          }
        }
        return null;
      })
      .filter(Boolean);
  }

  function getLanguageColor(ext: string) {
    const colors: Record<string, string> = {
      js: "#f1e05a",
      ts: "#3178c6",
      jsx: "#61dafb",
      tsx: "#3178c6",
      py: "#3572A5",
      java: "#b07219",
      cpp: "#f34b7d",
      html: "#e34c26",
      css: "#563d7c",
      scss: "#c6538c",
      json: "#292929",
      md: "#083fa1",
      txt: "#777777",
      default: "#ccc",
    };

    return colors[ext.toLowerCase()] || colors.default;
  }

  function findSelectedFileNode(tree: any[]): any | null {
    for (const node of tree) {
      if (node.type === "file" && node.fullPath === selectedPath) {
        return node;
      } else if (node.type === "folder" && node.children) {
        const found = findSelectedFileNode(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  const selectedFileNode = useMemo(() => {
    if (projectData) return findSelectedFileNode(project.fileTree);
  }, [project, selectedPath]);

  if (!project) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const filteredTree = filterFileTree(project.fileTree, searchTerm);

  interface SearchResult {
    path: string;
    line: number;
    snippet: string;
  }

  const groupedResults = searchResults.reduce<Record<string, SearchResult[]>>(
    (acc: any, curr: any) => {
      if (!acc[curr.path]) acc[curr.path] = [];
      acc[curr.path].push(curr);
      return acc;
    },
    {}
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col gap-2">
          {editingName ? (
            <input
              title="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRename();
                }
              }}
              className="text-2xl font-bold border border-input px-3 py-2 rounded-lg shadow-sm w-full max-w-sm"
              autoFocus
            />
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              className="text-3xl font-bold cursor-pointer hover:underline transition-opacity"
            >
              {project.projectName}
            </h1>
          )}

          <div className="flex flex-wrap gap-2 items-center mt-2">
            {tags?.map((tag, i) => (
              <span
                key={i}
                className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key.toLowerCase() === "enter" && tagInput.trim()) {
                  const updatedTags = [...tags, tagInput.trim()];
                  setTags(updatedTags);
                  setTagInput("");

                  const token = await getAuth().currentUser?.getIdToken();
                  await fetch(`/api/project?id=${projectId}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ tags: updatedTags }),
                  });
                }
              }}
              placeholder="Add tag..."
              className="text-xs border border-input px-3 py-1 rounded-full shadow-sm transition focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="text-red-500 hover:bg-red-50 text-sm flex items-center gap-1 self-start px-2 py-1 rounded-md transition"
        >
          <Trash size={16} />
          Delete Project
        </button>
      </div>

      {project.stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-muted p-4 rounded-lg shadow-sm border border-border flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">📁 Total Files</p>
            <p className="text-xl font-semibold text-primary">
              {project.stats.totalFiles}
            </p>
          </div>
          <div className="bg-muted p-4 rounded-lg shadow-sm border border-border flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">📂 Total Folders</p>
            <p className="text-xl font-semibold text-primary">
              {project.stats.totalFolders}
            </p>
          </div>
          <div className="bg-muted p-4 rounded-lg shadow-sm border border-border flex flex-col gap-1">
            <p className="text-md font-semibold text-muted-foreground mb-1">
              Top Languages :-
            </p>
            <ul className="text-sm grid grid-cols-2 sm:grid-cols-3 gap-4 font-medium text-muted-foreground">
              {project.stats.topLanguages.map((lang: any, i: number) => (
                <li key={i} className="text-muted-foreground">
                  <code className="bg-secondary px-2 py-0.5 rounded text-xs">
                    .{lang.ext}
                  </code>{" "}
                  — {lang.count}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {insights && (
        <div className="bg-muted rounded-lg p-4 border border-border mb-6">
          <h2 className="text-lg font-semibold mb-2">Project Insights</h2>
          <ul className="text-sm grid grid-cols-2 sm:grid-cols-3 gap-4">
            <li>
              <strong>Total Files:</strong> {insights.totalFiles}
            </li>
            <li>
              <strong>Folders:</strong> {insights.totalFolders}
            </li>
            <li>
              <strong>Lines of Code:</strong> {insights.totalLOC}
            </li>
            <li>
              <strong>Largest File:</strong> {insights.largestFile.name} (
              {insights.largestFile.loc} LOC)
            </li>
            {insights.topLanguages.length > 0 && (
              <li className="col-span-2">
                <strong>Top Languages:</strong>{" "}
                {insights.topLanguages
                  .slice(0, 3)
                  .map((lang: any, idx: any) => (
                    <span key={idx}>
                      {lang.ext.toUpperCase()} ({lang.loc} LOC){idx < 2 && ", "}
                    </span>
                  ))}
              </li>
            )}
          </ul>
        </div>
      )}

      {insights && insights.languageUsage.length > 0 && (
        <>
          <div className="mb-6">
            <div className="h-3 flex rounded overflow-hidden border border-border bg-muted/80 shadow-inner">
              {insights.languageUsage.map((lang: any, idx: any) => (
                <div
                  key={idx}
                  style={{ width: `${lang.percent}%` }}
                  className="h-full transition-all duration-300 ease-in-out"
                  title={`${lang.ext.toUpperCase()} — ${lang.percent}%`}
                >
                  <div
                    className="h-full"
                    style={{
                      backgroundColor: getLanguageColor(lang.ext),
                    }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {insights.languageUsage.map((lang: any, idx: any) => (
                <span key={idx}>
                  <span
                    className="inline-block w-3 h-3 rounded-sm mr-1"
                    style={{ backgroundColor: getLanguageColor(lang.ext) }}
                  ></span>
                  {lang.ext.toUpperCase()} ({lang.percent}%)
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {projectData && project.packageInfo && (
        <div className="bg-muted rounded-lg p-4 border border-border mb-6">
          <h2 className="text-md font-semibold mb-2">Package Info</h2>
          <p className="text-sm mb-2 text-muted-foreground">
            Detected package manager:{" "}
            <strong className="text-primary">
              {project.packageInfo.manager?.toUpperCase()}
            </strong>
          </p>

          {Object.keys(project.packageInfo.scripts || {}).length > 0 && (
            <>
              <h4 className="text-sm font-semibold mb-1">Scripts</h4>
              <ul className="list-disc ml-6 text-sm text-muted-foreground mb-3">
                {Object.entries(project.packageInfo.scripts).map(
                  ([name, cmd]: any, i) => (
                    <li key={i}>
                      <code className="text-primary font-medium">{name}</code>:{" "}
                      {cmd}
                    </li>
                  )
                )}
              </ul>
            </>
          )}

          {Object.keys(project.packageInfo.dependencies || {}).length > 0 && (
            <>
              <h4 className="text-sm font-semibold mb-1">Dependencies</h4>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-4 text-sm text-muted-foreground">
                {Object.entries(project.packageInfo.dependencies).map(
                  ([dep, version]: any, i) => (
                    <li key={i}>
                      <span className="font-medium">{dep}</span> {version}
                    </li>
                  )
                )}
              </ul>
            </>
          )}
        </div>
      )}

      <DependencyGraph nodesData={nodesData} edgesData={edgesData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium mb-2">
            📂 Project Files
          </p>
          <div>
            <input
              className="mb-4 w-full max-w-sm border rounded-md py-1 border-opacity-40 border-gray-500 px-3"
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {project && project.entryPoints?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-md font-semibold mb-2">Entry Points</h2>
              <ul className="list-disc ml-6 text-sm text-muted-foreground">
                {project.entryPoints.map((entry: any, i: any) => (
                  <li key={i}>
                    <code className="text-primary font-medium">{entry}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {project && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {project.tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full border"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="bg-muted rounded-lg p-4 mb-6 border border-border">
            <p className="text-sm font-medium mb-2">🔍 Global Code Search</p>
            <input
              className="mb-4 w-full max-w-lg border border-input px-3 py-2 rounded-md shadow-sm text-sm"
              type="text"
              placeholder="Search code across all files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  const res = await fetch("/api/project/search", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      projectId: project.projectId,
                      query: searchQuery,
                    }),
                  });
                  const data = await res.json();
                  setSearchResults(data.results || []);
                }
              }}
            />

            {searchResults.length > 0 &&
              Object.entries(groupedResults).map(([filePath, matches]: any) => (
                <div key={filePath}>
                  <p className="text-xs font-medium mb-1">{filePath}</p>
                  {matches.map((match: any, idx: number) => (
                    <div
                      key={idx}
                      className="cursor-pointer text-sm text-muted-foreground hover:bg-accent rounded px-2 py-1"
                      onClick={() => handleFileClick(filePath)}
                    >
                      <span className="text-xs text-muted-foreground">
                        Line {match.line}:{" "}
                      </span>
                      <code className="whitespace-pre-wrap break-words">
                        {match.snippet}
                      </code>
                    </div>
                  ))}
                </div>
              ))}
          </div>

          <ProjectTree
            fileTree={filteredTree || project.fileTree}
            onFileClick={handleFileClick}
          />
        </div>

        <div className="bg-background rounded-lg p-4 border shadow-sm overflow-auto max-h-[600px]">
          {selectedPath ? (
            <>
              <div className="text-xs text-muted-foreground mb-2">
                Viewing:{" "}
                <span className="font-mono font-medium">{selectedPath}</span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  className="mb-3 w-full max-w-md border border-input px-3 py-2 rounded-md shadow-sm text-sm"
                  placeholder="Search in file..."
                  value={fileSearchTerm}
                  onChange={(e) => setFileSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && matchIndices.length > 0) {
                      if (e.shiftKey) {
                        setCurrentMatchIndex(
                          (prev) =>
                            (prev - 1 + matchIndices.length) %
                            matchIndices.length
                        );
                      } else {
                        setCurrentMatchIndex(
                          (prev) => (prev + 1) % matchIndices.length
                        );
                      }
                    }

                    if (e.key === "Escape") {
                      setFileSearchTerm("");
                      setMatchIndices([]);
                      setCurrentMatchIndex(0);
                    }
                  }}
                />
              </div>

              <div className="rounded-lg overflow-auto border border-border">
                {/* <SyntaxHighlighter
                  language={detectLanguage(selectedPath)}
                  style={atomOneDark}
                  customStyle={{
                    fontSize: "0.85rem",
                    margin: 0,
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    overflowX: "auto",
                    lineHeight: "1.6",
                  }}
                >
                  {fileContent}
                </SyntaxHighlighter> */}

                <pre
                  className="text-sm bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
                {matchIndices.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <span>
                      Match {currentMatchIndex + 1} of {matchIndices.length}
                    </span>
                    <button
                      className="px-2 py-1 border rounded hover:bg-accent"
                      onClick={() =>
                        setCurrentMatchIndex(
                          (prev) =>
                            (prev - 1 + matchIndices.length) %
                            matchIndices.length
                        )
                      }
                    >
                      Prev
                    </button>
                    <button
                      className="px-2 py-1 border rounded hover:bg-accent"
                      onClick={() =>
                        setCurrentMatchIndex(
                          (prev) => (prev + 1) % matchIndices.length
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                )}

                {selectedFileNode?.imports?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-1">Imports</h4>
                    <ul className="text-sm list-disc ml-5 text-muted-foreground">
                      {selectedFileNode.imports.map(
                        (imp: string, idx: number) => (
                          <li key={idx}>{imp}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {selectedFileNode?.functions?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-1">Functions</h4>
                    <ul className="text-sm list-disc ml-5 text-muted-foreground">
                      {selectedFileNode.functions.map(
                        (fn: string, idx: number) => (
                          <li key={idx}>{fn}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {selectedFileNode?.classes?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-1">Classes</h4>
                    <ul className="text-sm list-disc ml-5 text-muted-foreground">
                      {selectedFileNode.classes.map(
                        (cls: string, idx: number) => (
                          <li key={idx}>{cls}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {selectedFileNode?.components?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-1">Components</h4>
                    <ul className="text-sm list-disc ml-5 text-muted-foreground">
                      {selectedFileNode.components.map(
                        (comp: string, idx: number) => (
                          <li key={idx}>{comp}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {selectedFileNode?.exports?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-1">Exports</h4>
                    <ul className="text-sm list-disc ml-5 text-muted-foreground">
                      {selectedFileNode.exports.map(
                        (exp: string, idx: number) => (
                          <li key={idx}>{exp}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {selectedFileNode?.highlights && (
                  <div className="mt-4 space-y-4">
                    {selectedFileNode.highlights.todos?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-1">TODOs</h4>
                        <ul className="list-disc ml-5 text-sm text-yellow-700">
                          {selectedFileNode.highlights.todos.map(
                            (item: string, i: number) => (
                              <li key={i}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {selectedFileNode.highlights.fixmes?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-1 text-red-600">
                          FIXMEs
                        </h4>
                        <ul className="list-disc ml-5 text-sm text-red-700">
                          {selectedFileNode.highlights.fixmes.map(
                            (item: string, i: number) => (
                              <li key={i}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {selectedFileNode.highlights.notes?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-1 text-blue-600">
                          Notes
                        </h4>
                        <ul className="list-disc ml-5 text-sm text-blue-700">
                          {selectedFileNode.highlights.notes.map(
                            (item: string, i: number) => (
                              <li key={i}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : readmeContent ? (
            <>
              {readmeSummary && (
                <div className="bg-muted rounded-lg p-4 border border-border mb-4">
                  <h2 className="text-md font-semibold mb-2">
                    📄 README Summary
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {readmeSummary}
                  </p>
                </div>
              )}
              <h2 className="text-lg font-bold mb-2">README.md</h2>
              <div className="prose prose-sm max-w-none text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {readmeContent}
                </ReactMarkdown>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">
              Select a file to preview it here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
