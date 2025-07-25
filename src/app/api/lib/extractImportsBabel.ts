import * as babelParser from "@babel/parser";
import traverse from "@babel/traverse";

export function extractImportsBabel(code: string): string[] {
  const ast = babelParser.parse(code, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
  });

  const imports = new Set<string>();

  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source?.value) {
        const value = path.node.source.value;
        if (value.startsWith(".") || value.startsWith("/")) {
          imports.add(`(local) ${value}`);
        } else {
          imports.add(value);
        }
      }
    },
    CallExpression(path) {
      const callee = path.node.callee;
      if (
        callee.type === "Identifier" &&
        callee.name === "require" &&
        path.node.arguments.length === 1
      ) {
        const arg = path.node.arguments[0];
        if (arg.type === "StringLiteral") {
          imports.add(arg.value);
        }
      }
    },
  });

  return [...imports];
}
