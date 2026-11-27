import { indentWithTab } from "@codemirror/commands";
import { LanguageDescription, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { EditorView, gutters, keymap, lineNumbers } from "@codemirror/view";
import { classHighlighter } from "@lezer/highlight";
import { cn } from "cn";
import { use } from "react";
import { Editor, type EditorProps } from "./editor.tsx";

const base = [gutters({ fixed: false }), lineNumbers(), keymap.of([indentWithTab])];
const code = [base, syntaxHighlighting(classHighlighter)];
const prose = [base, EditorView.lineWrapping];

const languageOf = (fileName: string) => LanguageDescription.matchFilename(languages, fileName);

export const preloadLanguage = (fileName: string) => languageOf(fileName)?.load();

export interface CodeEditorProps extends Omit<EditorProps, "label" | "extensions" | "onSubmit"> {
  readonly fileName: string;
}

export const CodeEditor = ({ fileName, className, ...props }: CodeEditorProps) => {
  const language = languageOf(fileName);
  const support = language ? use(language.load()) : undefined;
  return (
    <Editor
      {...props}
      label={fileName}
      extensions={support ? [code, support] : prose}
      className={cn("code-editor", className)}
    />
  );
};
