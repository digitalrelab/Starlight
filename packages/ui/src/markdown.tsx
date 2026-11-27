import { marked } from "marked";
import { memo, useMemo } from "react";
import { Prose } from "./prose.tsx";

const OPTIONS = { async: false, breaks: true } as const;

const Block = memo(({ raw }: { readonly raw: string }) => <Prose.Html html={marked.parse(raw, OPTIONS)} />);

export interface MarkdownProps {
  readonly source: string;
  readonly className?: string | undefined;
}

export const Markdown = ({ source, className }: MarkdownProps) => {
  const blocks = useMemo(() => marked.lexer(source, OPTIONS).map((token) => token.raw), [source]);
  return (
    <Prose.Root className={className}>
      {blocks.map((raw, index) => (
        <Block key={index} raw={raw} />
      ))}
    </Prose.Root>
  );
};
