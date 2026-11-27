import { ArrowUp02Icon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton } from "@starlight/ui";
import { type ReactNode, useState } from "react";

interface Props {
  readonly placeholder: string;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  readonly actions?: ReactNode;
  readonly onSubmit: (text: string) => Promise<unknown>;
}

export const Composer = ({ placeholder, disabled = false, autoFocus = false, actions, onSubmit }: Props) => {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = text.trim() !== "" && !disabled && !pending;

  const submit = () => {
    if (!ready) return;
    setPending(true);
    setError(null);
    onSubmit(text.trim())
      .then(
        () => setText(""),
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
        <textarea
          value={text}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={2}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
          className="max-h-64 min-h-12 resize-none bg-transparent px-1 chat-text outline-none field-sizing-content placeholder:text-subtlest"
        />
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
