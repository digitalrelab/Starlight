import { Editor, type EditorProps } from "@starlight/editor";
import { cn } from "cn";
import { type Variant, variants, writing } from "./writing.ts";

export interface MarkdownEditorProps extends Omit<EditorProps, "extensions"> {
  readonly variant?: Variant;
}

export const MarkdownEditor = ({ variant = "document", className, ...props }: MarkdownEditorProps) => (
  <Editor
    {...props}
    extensions={[writing, variants[variant]]}
    data-variant={variant}
    className={cn("markdown-editor", className)}
  />
);
