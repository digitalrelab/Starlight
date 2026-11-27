import { memo, type ReactNode, useEffect, useReducer } from "react";
import type * as HighlightModule from "./highlight.ts";
import type { Token } from "./highlight.ts";

type Highlighter = typeof HighlightModule;

let highlighter: Highlighter | undefined;
let loading: Promise<Highlighter> | undefined;

const loadHighlighter = () =>
  (loading ??= import("./highlight.ts").then((module) => {
    highlighter = module;
    return module;
  }));

const tokensOf = (code: string, language: string | undefined) => {
  if (!language) return null;
  return highlighter ? highlighter.highlight(code, language) : undefined;
};

const spansOf = (code: string, tokens: ReadonlyArray<Token>) => {
  const spans: Array<ReactNode> = [];
  let position = 0;
  for (const { from, to, classes } of tokens) {
    if (from > position) spans.push(code.slice(position, from));
    spans.push(
      <span key={from} className={classes}>
        {code.slice(from, to)}
      </span>,
    );
    position = to;
  }
  if (position < code.length) spans.push(code.slice(position));
  return spans;
};

interface Props {
  readonly code: string;
  readonly language: string | undefined;
}

export const CodeBlock = memo(({ code, language }: Props) => {
  const [, loaded] = useReducer((count: number) => count + 1, 0);
  const tokens = tokensOf(code, language);
  const isPending = tokens === undefined;

  useEffect(() => {
    if (!isPending || !language) return;
    loadHighlighter()
      .then((module) => module.loadLanguage(language))
      .then(loaded, () => undefined);
  }, [isPending, language]);

  return (
    <pre>
      <code data-language={language}>{tokens ? spansOf(code, tokens) : code}</code>
    </pre>
  );
});
