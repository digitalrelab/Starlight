import { lazy } from "react";

export const loadEditor = () => import("./document-editor.tsx");

export const DocumentEditor = lazy(() =>
  loadEditor().then(({ DocumentEditor }) => ({ default: DocumentEditor })),
);
