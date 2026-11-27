import { LanguageDescription } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { classHighlighter, highlightTree } from "@lezer/highlight";

export interface Token {
  readonly from: number;
  readonly to: number;
  readonly classes: string;
}

const describe = (name: string) => LanguageDescription.matchLanguageName(languages, name, true);

export const highlight = (code: string, name: string): ReadonlyArray<Token> | null | undefined => {
  const description = describe(name);
  if (!description) return null;
  if (!description.support) return undefined;
  const tokens: Array<Token> = [];
  highlightTree(description.support.language.parser.parse(code), classHighlighter, (from, to, classes) =>
    tokens.push({ from, to, classes }),
  );
  return tokens;
};

export const loadLanguage = (name: string) => describe(name)?.load();
