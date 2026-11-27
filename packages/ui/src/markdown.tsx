import { marked } from "marked";
import { useMemo } from "react";
import { Prose } from "./prose.tsx";

export interface MarkdownProps {
  readonly source: string;
  readonly className?: string;
}

export const Markdown = ({ source, className }: MarkdownProps) => {
  const html = useMemo(() => marked.parse(source, { async: false, gfm: true, breaks: true }), [source]);
  return <Prose html={html} {...(className ? { className } : {})} />;
};
