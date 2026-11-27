import { defineConfig } from "vite-plus";
import type { OxlintOverride } from "vite-plus/lint";

/** Import boundaries. Each package may only reach downward. */
const forbid = (...groups: string[]): OxlintOverride["rules"] => ({
  "no-restricted-imports": [
    "error",
    { patterns: [{ group: groups, message: "Crosses a package boundary." }] },
  ],
});

export default defineConfig({
  fmt: {
    printWidth: 110,
    ignorePatterns: ["**/routeTree.gen.ts"],
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "import"],
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: ["**/out/**", "**/routeTree.gen.ts"],
    rules: {
      "typescript/no-floating-promises": "error",
      "typescript/consistent-type-imports": "error",
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
        plugins: ["react"],
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
        plugins: ["react"],
        rules: {
          // Not using the React Compiler.
          "react/incompatible-library": "off",
          ...forbid(
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
      },
    ],
  },
});
