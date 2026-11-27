import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, languageDataProp, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { EditorView, keymap } from "@codemirror/view";
import type { NodeType } from "@lezer/common";
import { classHighlighter, type Highlighter, tags } from "@lezer/highlight";
import { extensions } from "../dialect.ts";
import { hangingIndents } from "./hanging.ts";

const support = markdown({ extensions, codeLanguages: languages });

const isMarkdown = (type: NodeType) => type.prop(languageDataProp) === support.language.data;

const codeHighlighter: Highlighter = {
  style: (tags) => classHighlighter.style(tags),
  scope: (type) => !isMarkdown(type),
};

const markupHighlighter = HighlightStyle.define(
  [
    { tag: [tags.processingInstruction, tags.atom, tags.contentSeparator], class: "md-mark" },
    { tag: [tags.labelName, tags.comment], class: "md-meta" },
    { tag: tags.heading, class: "md-heading" },
    { tag: tags.strong, class: "md-strong" },
    { tag: tags.emphasis, class: "md-emphasis" },
    { tag: tags.strikethrough, class: "md-strikethrough" },
    { tag: tags.link, class: "md-link" },
    { tag: tags.url, class: "md-url" },
    { tag: tags.monospace, class: "md-code" },
    { tag: tags.quote, class: "md-quote" },
  ],
  { scope: support.language },
);

export const writing = [
  support,
  syntaxHighlighting(codeHighlighter),
  syntaxHighlighting(markupHighlighter),
  hangingIndents,
  history(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  EditorView.lineWrapping,
];
