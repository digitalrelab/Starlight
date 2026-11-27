import type { SyntaxNode, Tree } from "@lezer/common";
import { cn } from "cn";
import { type CSSProperties, createElement, Fragment, memo, type ReactNode, useMemo, useState } from "react";
import { CodeBlock } from "./code-block.tsx";
import { createIncrementalParser } from "./parse.ts";
import { autolinkUrl, decodeEntity, referenceKey, safeUrl, unescape } from "./text.ts";

type References = ReadonlyMap<string, string>;

interface Source {
  readonly text: string;
  readonly references: References;
}

const HIDDEN = new Set([
  "CodeInfo",
  "CodeMark",
  "Comment",
  "CommentBlock",
  "EmphasisMark",
  "HeaderMark",
  "LinkMark",
  "LinkReference",
  "LinkTitle",
  "ListMark",
  "ProcessingInstruction",
  "ProcessingInstructionBlock",
  "QuoteMark",
  "StrikethroughMark",
  "TableDelimiter",
  "TaskMarker",
]);

const CONTAINERS = new Set(["Document", "Blockquote", "BulletList", "OrderedList", "ListItem"]);

const HEADINGS: Readonly<Record<string, `h${1 | 2 | 3 | 4 | 5 | 6}`>> = {
  ATXHeading1: "h1",
  ATXHeading2: "h2",
  ATXHeading3: "h3",
  ATXHeading4: "h4",
  ATXHeading5: "h5",
  ATXHeading6: "h6",
  SetextHeading1: "h1",
  SetextHeading2: "h2",
};

const FORMATS: Readonly<Record<string, "em" | "strong" | "del">> = {
  Emphasis: "em",
  StrongEmphasis: "strong",
  Strikethrough: "del",
};

const BLANK_LINE = /\n[ \t>]*\n/;
const LINE_BREAK = /\n/g;

const textOf = (source: Source, { from, to }: SyntaxNode) => source.text.slice(from, to);

const childrenOf = (node: SyntaxNode) => {
  const children: Array<SyntaxNode> = [];
  for (let child = node.firstChild; child; child = child.nextSibling) children.push(child);
  return children;
};

const visibleChildrenOf = (node: SyntaxNode) => childrenOf(node).filter(({ name }) => !HIDDEN.has(name));

const destinationOf = (raw: string) => unescape(raw.startsWith("<") ? raw.slice(1, -1) : raw);

const inline = (node: SyntaxNode, source: Source, from = node.from, to = node.to) => {
  const nodes: Array<ReactNode> = [];
  let position = from;
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.to <= from || child.from >= to) continue;
    if (child.from > position) nodes.push(source.text.slice(position, child.from));
    nodes.push(inlineElement(child, source));
    position = child.to;
  }
  if (to > position) nodes.push(source.text.slice(position, to));
  return nodes;
};

const anchor = (key: number, url: string, children: ReactNode) => {
  const href = safeUrl(url);
  return href ? (
    <a key={key} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Fragment key={key}>{children}</Fragment>
  );
};

interface Target {
  readonly url: string;
  readonly from: number;
  readonly to: number;
}

const targetOf = (node: SyntaxNode, source: Source): Target | undefined => {
  const [open, close] = node.getChildren("LinkMark");
  if (!open || !close) return undefined;
  const url = node.getChild("URL");
  if (url) return { url: destinationOf(textOf(source, url)), from: open.to, to: close.from };
  const label = node.getChild("LinkLabel");
  const name =
    label && label.to - label.from > 2
      ? source.text.slice(label.from + 1, label.to - 1)
      : source.text.slice(open.to, close.from);
  const resolved = source.references.get(referenceKey(name));
  return resolved === undefined ? undefined : { url: resolved, from: open.to, to: close.from };
};

const link = (node: SyntaxNode, source: Source) => {
  const target = targetOf(node, source);
  if (!target) return textOf(source, node);
  return anchor(node.from, target.url, inline(node, source, target.from, target.to));
};

const image = (node: SyntaxNode, source: Source) => {
  const target = targetOf(node, source);
  if (!target) return textOf(source, node);
  const alt = inline(node, source, target.from, target.to);
  return anchor(node.from, target.url, alt.length > 0 ? alt : target.url);
};

const inlineCode = (node: SyntaxNode, source: Source) => {
  const [open, close] = node.getChildren("CodeMark");
  let code = source.text.slice(open?.to ?? node.from, close?.from ?? node.to).replace(LINE_BREAK, " ");
  if (code.length > 2 && code.startsWith(" ") && code.endsWith(" ") && code.trim() !== "") {
    code = code.slice(1, -1);
  }
  return <code key={node.from}>{code}</code>;
};

const autolink = (node: SyntaxNode, source: Source) => {
  const url = node.getChild("URL");
  const text = url ? textOf(source, url) : textOf(source, node).slice(1, -1);
  return anchor(node.from, autolinkUrl(text), text);
};

const inlineElement = (node: SyntaxNode, source: Source): ReactNode => {
  const { name, from } = node;
  if (HIDDEN.has(name)) return null;
  const format = FORMATS[name];
  if (format) return createElement(format, { key: from }, inline(node, source));
  switch (name) {
    case "InlineCode":
      return inlineCode(node, source);
    case "Link":
      return link(node, source);
    case "Image":
      return image(node, source);
    case "Autolink":
      return autolink(node, source);
    case "URL":
      return anchor(from, autolinkUrl(textOf(source, node)), textOf(source, node));
    case "HardBreak":
      return <br key={from} />;
    case "Escape":
      return textOf(source, node).slice(1);
    case "Entity":
      return decodeEntity(textOf(source, node));
    default:
      return node.firstChild ? <Fragment key={from}>{inline(node, source)}</Fragment> : textOf(source, node);
  }
};

const countLineBreaks = (text: string) => text.match(LINE_BREAK)?.length ?? 0;

const codeOf = (node: SyntaxNode, source: Source) => {
  let code = "";
  let previous: SyntaxNode | undefined;
  for (const piece of node.getChildren("CodeText")) {
    if (previous) code += "\n".repeat(countLineBreaks(source.text.slice(previous.to, piece.from)));
    code += textOf(source, piece);
    previous = piece;
  }
  return code.replace(/\n+$/, "");
};

const languageOf = (node: SyntaxNode, source: Source) => {
  const info = node.getChild("CodeInfo");
  return info ? textOf(source, info).trim().split(/\s/, 1)[0] || undefined : undefined;
};

const contentEnd = (node: SyntaxNode): number => {
  if (!CONTAINERS.has(node.name)) return node.to;
  const last = visibleChildrenOf(node).at(-1);
  return last ? contentEnd(last) : node.to;
};

const isSpread = (nodes: ReadonlyArray<SyntaxNode>, source: Source) =>
  nodes.some((node, index) => {
    const previous = nodes[index - 1];
    return previous !== undefined && BLANK_LINE.test(source.text.slice(contentEnd(previous), node.from));
  });

const isLoose = (items: ReadonlyArray<SyntaxNode>, source: Source) =>
  isSpread(items, source) || items.some((item) => isSpread(visibleChildrenOf(item), source));

const paragraphOf = (key: number, content: ReactNode, isTight: boolean) =>
  isTight ? <Fragment key={key}>{content}</Fragment> : <p key={key}>{content}</p>;

const task = (node: SyntaxNode, source: Source, isTight: boolean) => {
  const marker = node.getChild("TaskMarker");
  const checked = marker !== null && /x/i.test(textOf(source, marker));
  return paragraphOf(
    node.from,
    <>
      <input type="checkbox" checked={checked} disabled readOnly />
      {inline(node, source, marker?.to)}
    </>,
    isTight,
  );
};

const items = (list: SyntaxNode, source: Source) => {
  const listItems = list.getChildren("ListItem");
  const isTight = !isLoose(listItems, source);
  return listItems.map((item) => {
    const children = visibleChildrenOf(item);
    return (
      <li key={item.from} data-task={children[0]?.name === "Task" ? "" : undefined}>
        {children.map((child) => {
          if (child.name === "Paragraph") return paragraphOf(child.from, inline(child, source), isTight);
          if (child.name === "Task") return task(child, source, isTight);
          return block(child, source);
        })}
      </li>
    );
  });
};

const orderedList = (node: SyntaxNode, source: Source) => {
  const mark = node.firstChild?.getChild("ListMark");
  const start = mark ? Number.parseInt(textOf(source, mark), 10) : 1;
  return (
    <ol key={node.from} start={start === 1 ? undefined : start}>
      {items(node, source)}
    </ol>
  );
};

type Alignment = CSSProperties["textAlign"];

const alignmentOf = (cell: string): Alignment => {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  return left ? "left" : undefined;
};

const alignmentsOf = (delimiter: string) =>
  delimiter
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => alignmentOf(cell.trim()));

const cellsOf = (row: SyntaxNode) => {
  const cells: Array<SyntaxNode | null> = [];
  let pending: SyntaxNode | null = null;
  for (const child of childrenOf(row)) {
    if (child.name === "TableCell") {
      pending = child;
    } else if (child.name === "TableDelimiter") {
      if (child.from > row.from || pending) cells.push(pending);
      pending = null;
    }
  }
  if (pending) cells.push(pending);
  return cells;
};

const table = (node: SyntaxNode, source: Source) => {
  const header = node.getChild("TableHeader");
  const delimiter = node.getChild("TableDelimiter");
  const alignments = delimiter ? alignmentsOf(textOf(source, delimiter)) : [];
  const row = (line: SyntaxNode, Cell: "th" | "td") => {
    const cells = cellsOf(line);
    return (
      <tr key={line.from}>
        {alignments.map((textAlign, index) => {
          const cell = cells[index];
          return (
            <Cell key={index} style={textAlign ? { textAlign } : undefined}>
              {cell ? inline(cell, source) : null}
            </Cell>
          );
        })}
      </tr>
    );
  };
  return (
    <div key={node.from} data-table="">
      <table>
        {header ? <thead>{row(header, "th")}</thead> : null}
        <tbody>{node.getChildren("TableRow").map((line) => row(line, "td"))}</tbody>
      </table>
    </div>
  );
};

const blocks = (node: SyntaxNode, source: Source) =>
  visibleChildrenOf(node).map((child) => block(child, source));

const block = (node: SyntaxNode, source: Source): ReactNode => {
  const { name, from } = node;
  const heading = HEADINGS[name];
  if (heading) return createElement(heading, { key: from }, inline(node, source));
  switch (name) {
    case "Paragraph":
      return <p key={from}>{inline(node, source)}</p>;
    case "Blockquote":
      return <blockquote key={from}>{blocks(node, source)}</blockquote>;
    case "BulletList":
      return <ul key={from}>{items(node, source)}</ul>;
    case "OrderedList":
      return orderedList(node, source);
    case "FencedCode":
      return <CodeBlock key={from} code={codeOf(node, source)} language={languageOf(node, source)} />;
    case "CodeBlock":
      return <CodeBlock key={from} code={codeOf(node, source)} language={undefined} />;
    case "HorizontalRule":
      return <hr key={from} />;
    case "Table":
      return table(node, source);
    case "HTMLBlock":
      return <p key={from}>{textOf(source, node)}</p>;
    default:
      return null;
  }
};

const referencesOf = (tree: Tree, text: string) => {
  const references = new Map<string, string>();
  tree.iterate({
    enter: (node) => {
      if (node.name !== "LinkReference") return CONTAINERS.has(node.name);
      const label = node.node.getChild("LinkLabel");
      const url = node.node.getChild("URL");
      if (label && url) {
        const key = referenceKey(text.slice(label.from + 1, label.to - 1));
        if (!references.has(key)) references.set(key, destinationOf(text.slice(url.from, url.to)));
      }
      return false;
    },
  });
  return references;
};

const hasSameEntries = (a: References, b: References) => {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) if (b.get(key) !== value) return false;
  return true;
};

const useDocument = (value: string) => {
  const [parse] = useState(createIncrementalParser);
  return useMemo(() => {
    const tree = parse(value);
    return { tree, source: { text: value, references: referencesOf(tree, value) } };
  }, [parse, value]);
};

interface BlockProps {
  readonly node: SyntaxNode;
  readonly text: string;
  readonly source: Source;
}

const Block = memo(
  ({ node, source }: BlockProps) => block(node, source),
  (previous, next) =>
    previous.text === next.text &&
    previous.node.from === next.node.from &&
    hasSameEntries(previous.source.references, next.source.references),
);

export interface MarkdownProps {
  readonly value: string;
  readonly className?: string;
}

export const Markdown = ({ value, className }: MarkdownProps) => {
  const { tree, source } = useDocument(value);
  return (
    <div className={cn("markdown", className)}>
      {visibleChildrenOf(tree.topNode).map((node) => (
        <Block key={node.from} node={node} text={textOf(source, node)} source={source} />
      ))}
    </div>
  );
};
