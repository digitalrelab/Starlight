import { lazy } from "react";

export const loadMarkdownEditor = () => import("@starlight/markdown/editor");

export const loadCodeEditor = () => import("@starlight/editor/code");

export const MarkdownEditor = lazy(() =>
  loadMarkdownEditor().then(({ MarkdownEditor }) => ({ default: MarkdownEditor })),
);

export const CodeEditor = lazy(() => loadCodeEditor().then(({ CodeEditor }) => ({ default: CodeEditor })));
