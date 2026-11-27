import { lazy } from "react";

export const loadEditor = () => import("@starlight/markdown/editor");

export const MarkdownEditor = lazy(() =>
  loadEditor().then(({ MarkdownEditor }) => ({ default: MarkdownEditor })),
);
