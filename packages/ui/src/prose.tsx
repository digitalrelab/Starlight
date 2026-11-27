import { createElement, Fragment, type ReactNode, useMemo } from "react";
import { cn } from "cn";

const RENDERED = new Set(["h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "code"]);
const UNWRAPPED = new Set(["a", "span", "div"]);

const toReact = (node: ChildNode, key: number): ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (!(node instanceof Element)) return null;
  const tag = node.localName;
  if (!RENDERED.has(tag) && !UNWRAPPED.has(tag)) return null;
  return createElement(RENDERED.has(tag) ? tag : Fragment, { key }, Array.from(node.childNodes, toReact));
};

export interface ProseProps {
  readonly html: string;
  readonly className?: string;
}

export const Prose = ({ html, className }: ProseProps) => {
  const nodes = useMemo(
    () => Array.from(new DOMParser().parseFromString(html, "text/html").body.childNodes, toReact),
    [html],
  );

  return (
    <div
      className={cn(
        "text-base *:first:mt-0",
        "[&_:is(h1,h2,h3,h4)]:mt-3 [&_:is(h1,h2,h3,h4)]:mb-1 [&_:is(h1,h2,h3,h4)]:font-medium",
        "[&_:is(h3,h4)]:text-xs [&_:is(h3,h4)]:text-subtle",
        "[&_ol]:list-decimal [&_ul]:list-disc [&_:is(ol,ul)]:pl-4 [&_li]:my-0.5 [&_p]:my-1",
        "[&_code]:font-mono [&_code]:text-sm [&_strong]:font-medium",
        className,
      )}
    >
      {nodes}
    </div>
  );
};
