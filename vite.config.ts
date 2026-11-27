import { defineConfig } from "vite-plus";
import type { OxlintOverride } from "vite-plus/lint";

const baseUiSubpaths = { group: ["@base-ui/react/*"], message: "Import from @base-ui/react." };
const parentPaths = { regex: "^\\.\\./", message: "Import through the package's # alias." };
const restrictedEverywhere = [baseUiSubpaths, parentPaths];

const reactCompiler: OxlintOverride["rules"] = Object.fromEntries(
  [
    "capitalized-calls",
    "error-boundaries",
    "globals",
    "hooks",
    "immutability",
    "invariant",
    "memo-dependencies",
    "preserve-manual-memoization",
    "purity",
    "refs",
    "rule-suppression",
    "set-state-in-effect",
    "set-state-in-render",
    "static-components",
    "syntax",
    "todo",
    "unsupported-syntax",
    "use-memo",
    "void-use-memo",
  ].map((rule) => [`react/${rule}`, "error"]),
);

const forbid = (...groups: string[]): OxlintOverride["rules"] => ({
  "no-restricted-imports": [
    "error",
    { patterns: [{ group: groups, message: "Crosses a package boundary." }, ...restrictedEverywhere] },
  ],
});

export default defineConfig({
  fmt: {
    printWidth: 110,
    ignorePatterns: ["**/routeTree.gen.ts", "CHANGELOG.md"],
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "import"],
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: ["**/out/**", "**/routeTree.gen.ts"],
    rules: {
      "typescript/no-floating-promises": "error",
      "typescript/consistent-type-imports": "error",
      "no-restricted-imports": ["error", { patterns: restrictedEverywhere }],
    },
    overrides: [
      {
        files: ["packages/contracts/**"],
        rules: forbid("@starlight/*", "@effect/*", "node:*", "electron", "react", "react-dom", "@tanstack/*"),
      },
      {
        files: ["packages/core/**"],
        rules: forbid(
          "@starlight/host",
          "@starlight/client",
          "@starlight/ui",
          "@effect/*",
          "node:*",
          "electron",
          "react",
          "@tanstack/*",
        ),
      },
      {
        files: ["packages/host/**"],
        rules: forbid("@starlight/client", "@starlight/ui", "electron", "react", "@tanstack/*"),
      },
      {
        files: ["packages/client/**"],
        rules: forbid(
          "@starlight/core",
          "@starlight/host",
          "@starlight/ui",
          "@effect/*",
          "node:*",
          "electron",
          "react",
        ),
      },
      {
        files: ["packages/ui/**"],
        rules: forbid("@starlight/*", "effect", "effect/*", "@effect/*", "@tanstack/*", "node:*", "electron"),
      },
      {
        files: ["packages/markdown/**"],
        rules: forbid("@starlight/*", "effect", "effect/*", "@effect/*", "@tanstack/*", "node:*", "electron"),
      },
      {
        files: ["apps/desktop/src/main/**", "apps/desktop/src/preload/**"],
        rules: forbid(
          "@starlight/core",
          "@starlight/client",
          "@starlight/ui",
          "react",
          "react-dom",
          "@tanstack/*",
        ),
      },
      {
        files: ["apps/desktop/src/renderer/**"],
        rules: forbid(
          "@starlight/contracts",
          "@starlight/core",
          "@starlight/host",
          "@starlight/host/*",
          "effect",
          "effect/*",
          "@effect/*",
          "node:*",
          "electron",
        ),
      },
      {
        files: ["apps/desktop/src/renderer/**", "packages/ui/**", "packages/markdown/**"],
        plugins: ["react"],
        rules: { ...reactCompiler, "react/incompatible-library": "off" },
      },
    ],
  },
});
