import { ArrowUp02Icon } from "@hugeicons-pro/core-stroke-rounded";
import { MarkdownEditor } from "@starlight/markdown/editor";
import { IconButton, ScrollArea } from "@starlight/ui";
import { type ReactNode, useState } from "react";
import { useMentions } from "#renderer/features/references/use-mentions.tsx";

interface Props {
  readonly placeholder: string;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  readonly actions?: ReactNode;
  readonly onSubmit: (text: string) => Promise<unknown>;
}

export const Composer = ({ placeholder, disabled = false, autoFocus = false, actions, onSubmit }: Props) => {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mentions = useMentions();
  const ready = text.trim() !== "" && !disabled && !pending;

  const submit = () => {
    if (!ready) return;
    setPending(true);
    setError(null);
    onSubmit(text.trim())
      .then(
        () => {
          setText("");
          setSent((count) => count + 1);
        },
        (cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause)),
      )
      .finally(() => setPending(false));
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        className="flex flex-col gap-2 rounded-xl border border-default bg-surface-raised p-3 shadow-xs"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <ScrollArea className="max-h-64 px-1">
          <MarkdownEditor
            key={sent}
            value=""
            label="Message"
            variant="message"
            className="min-h-12 chat-text"
            placeholder={placeholder}
            autoFocus={autoFocus || sent > 0}
            extensions={mentions.extension}
            onChange={(read) => setText(read())}
            onSubmit={submit}
          />
        </ScrollArea>
        {mentions.element}
        <div className="flex items-center justify-end gap-1">
          {actions}
          <IconButton
            type="submit"
            icon={ArrowUp02Icon}
            label="Send"
            disabled={!ready}
            className="rounded-full"
          />
        </div>
      </form>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
};
