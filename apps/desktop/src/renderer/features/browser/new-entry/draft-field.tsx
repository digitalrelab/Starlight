import type { CreatableKind, EntryRef } from "@starlight/client";
import { Tooltip } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { type SyntheticEvent, useRef, useState } from "react";
import { KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { listOf } from "#renderer/features/browser/layouts/events.ts";
import { type Draft, endDraft } from "./draft.ts";

const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();

const selectName = (input: HTMLInputElement, kind: CreatableKind) => {
  const dot = kind === "file" ? input.value.lastIndexOf(".") : -1;
  input.setSelectionRange(0, dot > 0 ? dot : input.value.length);
};

interface Props {
  readonly projectId: string;
  readonly directory: EntryRef;
  readonly draft: Draft;
  readonly onCreated: (created: { readonly ref: EntryRef; readonly kind: CreatableKind }) => void;
}

export const DraftField = ({ projectId, directory, draft, onCreated }: Props) => {
  const { mutations } = useStarlight();
  const create = useMutation(mutations.createEntry(projectId, directory));
  const [name, setName] = useState(draft.name);
  const ref = useRef<HTMLInputElement>(null);
  const ended = useRef(false);
  const problem = create.isError && create.variables.name === name.trim() ? create.error.message : null;

  const end = () => {
    ended.current = true;
    const input = ref.current;
    if (input && input === document.activeElement) listOf(input)?.focus({ preventScroll: true });
    endDraft(draft);
  };

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed === "") return end();
    if (create.isPending || problem) return;
    create.mutate(
      { name: trimmed, kind: draft.kind },
      {
        onSuccess: (created) => {
          end();
          onCreated({ ref: created, kind: draft.kind });
        },
      },
    );
  };

  return (
    <>
      <KindIcon kind={itemKindOf({ kind: draft.kind, name })} className="shrink-0" />
      <Tooltip label={problem ?? ""} open={problem !== null} side="bottom">
        <input
          ref={ref}
          autoFocus
          aria-label="Name"
          aria-invalid={problem !== null}
          value={name}
          readOnly={create.isPending}
          spellCheck={false}
          autoComplete="off"
          onFocus={(event) => selectName(event.currentTarget, draft.kind)}
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
    </>
  );
};
