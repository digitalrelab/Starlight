import { createRequire } from "node:module";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

const require = createRequire(import.meta.url);
const root = import.meta.dirname;
const renderer = resolve(root, "src/renderer");

export default defineConfig({
  main: {
    build: {
      // Bundle everything: workspace packages ship TS source, and there are no native deps.
      externalizeDeps: false,
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
        // Sandboxed preloads must be CommonJS.
        output: { format: "cjs", entryFileNames: "[name].cjs" },
      },
    },
  },
  renderer: {
    root: renderer,
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
    ],
  },
});
