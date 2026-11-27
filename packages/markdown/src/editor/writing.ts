import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { insertNewlineContinueMarkup, markdown } from "@codemirror/lang-markdown";
import { Language, LanguageSupport, languageDataProp } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import type { NodeType } from "@lezer/common";
import { classHighlighter, type Highlighter, tagHighlighter, tags } from "@lezer/highlight";
import { extensions } from "#dialect.ts";
import { hangingIndents } from "./hanging.ts";
import { highlighting } from "./highlighting.ts";
import { WindowedParser } from "./windowed-parser.ts";

const support = markdown({ extensions, codeLanguages: languages });

const language = new Language(
  support.language.data,
  new WindowedParser(support.language.parser),
  [],
  "markdown",
);

const isMarkdown = (type: NodeType) => type.prop(languageDataProp) === support.language.data;

const codeHighlighter: Highlighter = { ...classHighlighter, scope: (type) => !isMarkdown(type) };

const markupHighlighter: Highlighter = {
  ...tagHighlighter([
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
  ]),
  scope: isMarkdown,
};

export const writing = [
  new LanguageSupport(language, support.support),
  highlighting(codeHighlighter, markupHighlighter),
  history(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  EditorView.lineWrapping,
];

export const variants = { document: hangingIndents, message: [] };

export type Variant = keyof typeof variants;

export const submitOnEnter = (submit: () => void) =>
  Prec.highest(
    keymap.of([
      {
        key: "Enter",
        run: (view) => {
          if (view.composing) return false;
          submit();
          return true;
        },
        shift: insertNewlineContinueMarkup,
      },
    ]),
  );
