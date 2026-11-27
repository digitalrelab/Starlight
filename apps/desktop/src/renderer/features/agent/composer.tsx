import { ArrowUp02Icon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton } from "@starlight/ui";
import { useState } from "react";

interface Props {
  readonly placeholder: string;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  readonly onSubmit: (text: string) => void;
}

export const Composer = ({ placeholder, disabled = false, autoFocus = false, onSubmit }: Props) => {
  const [text, setText] = useState("");
  const ready = text.trim() !== "" && !disabled;

  const submit = () => {
    if (!ready) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
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
        className="max-h-64 min-h-12 resize-none bg-transparent px-1 text-base outline-none field-sizing-content placeholder:text-subtlest"
      />
      <div className="flex justify-end">
        <IconButton
          type="submit"
          icon={ArrowUp02Icon}
          label="Send"
          disabled={!ready}
          className="rounded-full"
        />
      </div>
    </form>
  );
};
