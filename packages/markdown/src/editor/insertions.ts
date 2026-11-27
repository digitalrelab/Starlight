import type { EditorState, TransactionSpec } from "@codemirror/state";

type Markup = (lineBreak: string) => readonly [before: string, after: string];

type Placement = "inline" | "line" | "paragraph";

export interface Insertion {
  readonly name: string;
  readonly keywords: ReadonlyArray<string>;
  readonly hint: string;
  readonly placement: Placement;
  readonly markup: Markup;
}

const prefixed = <Name extends string>(name: Name, keywords: ReadonlyArray<string>, hint: string) =>
  ({ name, keywords, hint, placement: "line", markup: () => [`${hint} `, ""] }) satisfies Insertion;

export const INSERTIONS = [
  prefixed("Heading 1", ["h1", "title"], "#"),
  prefixed("Heading 2", ["h2", "subtitle"], "##"),
  prefixed("Heading 3", ["h3"], "###"),
  prefixed("Bulleted list", ["ul", "unordered"], "-"),
  prefixed("Numbered list", ["ol", "ordered"], "1."),
  prefixed("Checklist", ["todo", "task", "list"], "- [ ]"),
  prefixed("Quote", ["blockquote"], ">"),
  {
    name: "Code block",
    keywords: ["fence", "snippet"],
    hint: "```",
    placement: "line",
    markup: (lineBreak) => [`\`\`\`${lineBreak}`, `${lineBreak}\`\`\``],
  },
  {
    name: "Table",
    keywords: ["grid", "columns"],
    hint: "| |",
    placement: "paragraph",
    markup: (lineBreak) => ["| ", ` |  |${lineBreak}| --- | --- |${lineBreak}|  |  |`],
  },
  {
    name: "Divider",
    keywords: ["rule", "hr", "separator"],
    hint: "---",
    placement: "paragraph",
    markup: (lineBreak) => [`---${lineBreak}`, ""],
  },
  { name: "Link", keywords: ["url"], hint: "[]()", placement: "inline", markup: () => ["[", "]()"] },
] as const satisfies ReadonlyArray<Insertion>;

export type InsertionName = (typeof INSERTIONS)[number]["name"];

const wordsOf = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);

export const insertionMatches = ({ name, keywords }: Insertion, query: string) => {
  const words = wordsOf([name, ...keywords].join(" "));
  return wordsOf(query).every((needle) => words.some((word) => word.startsWith(needle)));
};

const replace = (state: EditorState, from: number, to: number, before: string, after: string) => ({
  changes: { from, to, insert: before + after },
  selection: { anchor: from + state.toText(before).length },
  scrollIntoView: true,
});

export const insert = (
  { placement, markup }: Insertion,
  state: EditorState,
  from: number,
  to: number,
): TransactionSpec => {
  const [before, after] = markup(state.lineBreak);
  if (placement === "inline") return replace(state, from, to, before, after);
  const line = state.doc.lineAt(from);
  const lead = state.sliceDoc(line.from, from);
  const midLine = lead.trim() !== "";
  const start = midLine ? line.from + lead.trimEnd().length : from;
  const previous = midLine ? lead : line.number > 1 ? state.doc.line(line.number - 1).text : "";
  const gap = placement === "paragraph" && previous.trim() !== "";
  const breaks = state.lineBreak.repeat(Number(midLine) + Number(gap));
  return replace(state, start, to, breaks + before, after);
};
