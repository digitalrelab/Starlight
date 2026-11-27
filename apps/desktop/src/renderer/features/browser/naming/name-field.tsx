import type { EntryRef } from "@starlight/client";
import { Tooltip } from "@starlight/ui";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { type SyntheticEvent, useRef, useState } from "react";
import { useStarlight } from "#renderer/lib/context.ts";
import { listOf } from "#renderer/features/browser/layouts/events.ts";
import { endNaming, type Naming } from "./session.ts";

const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();

const selectName = (input: HTMLInputElement, stem: boolean) => {
  const dot = stem ? input.value.lastIndexOf(".") : -1;
  input.setSelectionRange(0, dot > 0 ? dot : input.value.length);
};

interface Props {
  readonly projectId: string;
  readonly directory: EntryRef;
  readonly naming: Naming;
  readonly onNamed: (ref: EntryRef) => void;
}

export const NameField = ({ projectId, directory, naming, onNamed }: Props) => {
  const { mutations } = useStarlight();
  const options: UseMutationOptions<EntryRef, Error, string> =
    naming.target === null
      ? mutations.createEntry(projectId, directory, naming.kind)
      : mutations.renameEntry(projectId, directory, naming.target);
  const save = useMutation(options);
  const [name, setName] = useState(naming.name);
  const ref = useRef<HTMLInputElement>(null);
  const ended = useRef(false);
  const problem = save.isError && save.variables === name.trim() ? save.error.message : null;

  const end = () => {
    ended.current = true;
    const input = ref.current;
    if (input && input === document.activeElement) listOf(input)?.focus({ preventScroll: true });
    endNaming(naming);
  };

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed === "" || (naming.target !== null && trimmed === naming.name)) return end();
    if (save.isPending || problem) return;
    save.mutate(trimmed, {
      onSuccess: (named) => {
        end();
        onNamed(named);
      },
    });
  };

  return (
    <Tooltip label={problem ?? ""} open={problem !== null} side="bottom">
      <input
        ref={ref}
        autoFocus
        aria-label="Name"
        aria-invalid={problem !== null}
        value={name}
        readOnly={save.isPending}
        spellCheck={false}
        autoComplete="off"
        onFocus={(event) => selectName(event.currentTarget, naming.kind === "file")}
        onChange={(event) => setName(event.currentTarget.value)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") commit();
          if (event.key === "Escape") end();
        }}
        onBlur={() => {
          if (ended.current || !document.hasFocus()) return;
          if (problem) end();
          else commit();
        }}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        onPointerDown={stopPropagation}
        onContextMenu={stopPropagation}
        className="min-w-0 flex-1 bg-transparent outline-none"
      />
    </Tooltip>
  );
};
