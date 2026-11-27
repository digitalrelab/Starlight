import { Editor, type EditorProps } from "@starlight/editor";
import { cn } from "cn";
import { type Variant, variants, writing } from "./writing.ts";

export { insertLink, type MentionHosts, mentionChips } from "./mentions.ts";
export { type ActiveTrigger, type TriggerSource, type TriggerStore, useTrigger } from "./trigger.ts";

export interface MarkdownEditorProps extends EditorProps {
  readonly variant?: Variant;
}

export const MarkdownEditor = ({
  variant = "document",
  extensions = [],
  className,
  ...props
}: MarkdownEditorProps) => (
  <Editor
    {...props}
    extensions={[writing, variants[variant], extensions]}
    data-variant={variant}
    className={cn("markdown-editor", className)}
  />
);
