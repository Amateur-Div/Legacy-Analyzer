import * as babelParser from "@babel/parser";
import traverse from "@babel/traverse";

export function extractSymbolsBabel(code: string) {
  const ast = babelParser.parse(code, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
  });

  const functions = new Set<string>();
  const classes = new Set<string>();
  const components = new Set<string>();
  const interfaces = new Set<string>();
  const exports = new Set<string>();

  const addSymbol = (
    name: string | null | undefined,
    opts: {
      addToExports?: boolean;
      type?: "function" | "class" | "interface";
    } = {}
  ) => {
    if (!name) return;

    if (opts.type === "function") functions.add(name);
    if (opts.type === "class") classes.add(name);
    if (opts.type === "interface") interfaces.add(name);

    if (
      /^[A-Z]/.test(name) &&
      (opts.type === "function" || opts.type === "class") &&
      code.includes(`return <`)
    )
      components.add(name);

    if (opts.addToExports) exports.add(name);
  };

  traverse(ast, {
    FunctionDeclaration(path) {
      const name = path.node.id?.name;
      addSymbol(name, { type: "function" });
    },

    VariableDeclarator(path) {
      const id = path.node.id;
      const init = path.node.init;

      if (
        id.type === "Identifier" &&
        init &&
        (init.type === "ArrowFunctionExpression" ||
          init.type === "FunctionExpression")
      ) {
        addSymbol(id.name, { type: "function" });
      }
    },

    ClassDeclaration(path) {
      addSymbol(path.node.id?.name, { type: "class" });
    },

    TSInterfaceDeclaration(path) {
      addSymbol(path.node.id.name, { type: "interface" });
    },

    TSTypeAliasDeclaration(path) {
      addSymbol(path.node.id.name, { type: "interface" });
    },

    ExportNamedDeclaration(path) {
      const decl = path.node.declaration;

      if (decl) {
        if (decl.type === "FunctionDeclaration" && decl.id?.name) {
          addSymbol(decl.id.name, { type: "function", addToExports: true });
        } else if (decl.type === "ClassDeclaration" && decl.id?.name) {
          addSymbol(decl.id.name, { type: "class", addToExports: true });
        } else if (
          decl.type === "TSTypeAliasDeclaration" ||
          decl.type === "TSInterfaceDeclaration"
        ) {
          addSymbol(decl.id.name, { type: "interface", addToExports: true });
        } else if (decl.type === "VariableDeclaration") {
          decl.declarations.forEach((d: any) => {
            const name = d.id?.name;
            if (!name) return;

            addSymbol(name, { addToExports: true });

            if (
              d.init?.type === "ArrowFunctionExpression" ||
              d.init?.type === "FunctionExpression"
            ) {
              addSymbol(name, { type: "function" });
            } else if (d.init?.type === "ClassExpression") {
              addSymbol(name, { type: "class" });
            }
          });
        }
      }

      path.node.specifiers?.forEach((spec) => {
        if (spec.type === "ExportSpecifier") {
          const name =
            spec.exported.type === "Identifier" ? spec.exported.name : null;
          addSymbol(name, { addToExports: true });
        }
      });
    },

    ExportDefaultDeclaration(path) {
      const decl: any = path.node.declaration;

      if (decl?.id?.name) {
        addSymbol(decl.id.name, {
          addToExports: true,
          type:
            decl.type === "FunctionDeclaration"
              ? "function"
              : decl.type === "ClassDeclaration"
              ? "class"
              : undefined,
        });
      } else if (decl?.name) {
        addSymbol(decl.name, { addToExports: true });
      }
    },

    AssignmentExpression(path) {
      const left = path.node.left;
      const right = path.node.right;

      if (
        left.type === "MemberExpression" &&
        left.object.type === "Identifier" &&
        ["exports", "module"].includes(left.object.name)
      ) {
        let key = "";

        if (left.property.type === "Identifier") {
          key = left.property.name;
        } else if (left.property.type === "StringLiteral") {
          key = left.property.value;
        }

        const isObjectExport =
          left.object.name === "module" &&
          left.property.type === "Identifier" &&
          left.property.name === "exports" &&
          right.type === "ObjectExpression";

        if (isObjectExport) {
          right.properties.forEach((prop: any) => {
            const key = prop.key?.name || prop.key?.value;
            if (!key) return;

            addSymbol(key, { addToExports: true });

            const val = prop.value;
            if (
              val.type === "FunctionExpression" ||
              val.type === "ArrowFunctionExpression"
            ) {
              addSymbol(key, { type: "function" });
            } else if (val.type === "ClassExpression") {
              addSymbol(key, { type: "class" });
            }
          });
        } else if (key) {
          addSymbol(key, { addToExports: true });

          if (
            right.type === "FunctionExpression" ||
            right.type === "ArrowFunctionExpression"
          ) {
            addSymbol(key, { type: "function" });
          } else if (right.type === "ClassExpression") {
            addSymbol(key, { type: "class" });
          }
        }
      }
    },
  });

  return {
    functions: [...functions],
    classes: [...classes],
    components: [...components],
    interfaces: [...interfaces],
    exports: [...exports],
  };
}
