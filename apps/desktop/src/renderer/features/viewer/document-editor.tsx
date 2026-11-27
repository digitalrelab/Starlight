import { MarkdownEditor, type MarkdownEditorProps } from "@starlight/markdown/editor";
import { useSlashCommands } from "#renderer/features/editor/slash-commands.tsx";

export const DocumentEditor = (props: Omit<MarkdownEditorProps, "extensions" | "variant">) => {
  const slash = useSlashCommands();
  return (
    <>
      <MarkdownEditor {...props} extensions={slash.extension} />
      {slash.element}
    </>
  );
};
