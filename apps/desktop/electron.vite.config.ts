import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import type { Plugin } from "vite";

const require = createRequire(import.meta.url);
const root = import.meta.dirname;
const renderer = resolve(root, "src/renderer");

const git = (args: string) => execSync(`git ${args}`, { cwd: root, encoding: "utf8" }).trim();

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);

const devInstanceLabel = (): Plugin => ({
  name: "starlight:dev-instance-label",
  apply: "serve",
  transformIndexHtml: () => {
    const branch = git("rev-parse --abbrev-ref HEAD");
    return [
      {
        tag: "div",
        attrs: {
          style:
            "position:fixed;right:8px;bottom:6px;z-index:2147483647;pointer-events:none;padding:2px 6px;border-radius:999px;font:500 11px/16px system-ui;color:rgb(128 128 128/0.9);background:rgb(128 128 128/0.15)",
        },
        children: escapeHtml(branch === "HEAD" ? git("rev-parse --short HEAD") : branch),
        injectTo: "body",
      },
    ];
  },
});

export default defineConfig({
  main: {
    build: {
      rolldownOptions: {
        input: {
          index: resolve(root, "src/main/index.ts"),
          host: require.resolve("@starlight/host/main"),
        },
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: false,
      rolldownOptions: {
        input: { index: resolve(root, "src/preload/index.ts") },
        output: { format: "cjs", entryFileNames: "[name].cjs" },
      },
    },
  },
  renderer: {
    root: renderer,
    optimizeDeps: { include: ["@starlight/ui > @base-ui/react"] },
    build: { rolldownOptions: { input: resolve(renderer, "index.html") } },
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: resolve(renderer, "routes"),
        generatedRouteTree: resolve(renderer, "routeTree.gen.ts"),
      }),
      react(),
      tailwindcss(),
      devInstanceLabel(),
    ],
  },
});
