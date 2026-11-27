import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry, EntryRef } from "@starlight/client";
import { PLAYER_ATTRIBUTE } from "@starlight/media-player";
import { Button, Icon, IconButton, Theater } from "@starlight/ui";
import { type KeyboardEvent, useEffect, useEffectEvent, useRef, useState } from "react";
import { KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { Inspector } from "#renderer/features/inspector/inspector.tsx";
import { InspectorToggle } from "#renderer/features/inspector/inspector-toggle.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { FileStage } from "./file-stage.tsx";
import { fileBytes } from "#renderer/features/files/file-bytes.ts";
import { loadEditor } from "./markdown-file.ts";
import { pictureUrl, presentationOf } from "./presentation.ts";
import { StatusSlot } from "./status-slot.ts";

interface Props {
  readonly projectId: string;
  readonly directory: EntryRef;
  readonly directoryName: string;
  readonly entries: ReadonlyArray<Entry>;
  readonly file: EntryRef;
  readonly onShow: (file: EntryRef) => void;
  readonly onClose: () => void;
  readonly inspector: boolean;
}

const PREVIOUS_KEY = "ArrowLeft";
const NEXT_KEY = "ArrowRight";

const isKeyConsumed = (event: KeyboardEvent) =>
  event.defaultPrevented ||
  event.altKey ||
  event.ctrlKey ||
  event.metaKey ||
  event.shiftKey ||
  (event.target instanceof HTMLElement &&
    (event.target.isContentEditable || event.target.closest(`[${PLAYER_ATTRIBUTE}]`) !== null));

const usePrefetch = (
  projectId: string,
  directory: EntryRef,
  previous: Entry | undefined,
  next: Entry | undefined,
) => {
  const { queryClient, queries } = useStarlight();
  useEffect(() => {
    for (const entry of [next, previous]) {
      if (!entry) continue;
      const presentation = presentationOf(entry);
      if (presentation === "none") continue;
      void queryClient.query(queries.fileSource(projectId, directory, entry.ref)).then(
        (source) => {
          if (presentation === "markdown") {
            void loadEditor();
            return queryClient.prefetchQuery(fileBytes(source));
          }
          if (presentation !== "video") new Image().src = pictureUrl(source, presentation);
        },
        () => undefined,
      );
    }
  }, [queryClient, queries, projectId, directory, previous, next]);
};

export const FileViewer = ({
  projectId,
  directory,
  directoryName,
  entries,
  file,
  onShow,
  onClose,
  inspector,
}: Props) => {
  const files = entries.filter((entry) => entry.kind === "file");
  const sequenced = files.length > 1;
  const [statusSlot, setStatusSlot] = useState<HTMLElement | null>(null);
  const index = files.findIndex(({ ref }) => ref.id === file.id && ref.source === file.source);
  const current = files[index];
  const previous = index > 0 ? files[index - 1] : undefined;
  const next = index >= 0 ? files[index + 1] : undefined;
  usePrefetch(projectId, directory, previous, next);

  const shownAt = useRef(index);
  const recover = useEffectEvent(() => {
    const fallback = files[Math.min(shownAt.current, files.length - 1)];
    if (fallback) onShow(fallback.ref);
    else onClose();
  });
  useEffect(() => {
    if (index >= 0) shownAt.current = index;
    else recover();
  }, [index]);

  const showPrevious = previous && (() => onShow(previous.ref));
  const showNext = next && (() => onShow(next.ref));
  const keys: Readonly<Record<string, (() => void) | undefined>> = {
    [PREVIOUS_KEY]: showPrevious,
    [NEXT_KEY]: showNext,
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const run = keys[event.key];
    if (!run || isKeyConsumed(event)) return;
    event.preventDefault();
    run();
  };

  return (
    <Theater.Root onClose={onClose} onKeyDown={onKeyDown}>
      <Theater.Header className="h-titlebar pl-traffic-lights app-drag">
        <Theater.Start className="app-no-drag">
          <Button onClick={onClose} className="max-w-48">
            <Icon icon={ArrowLeft01Icon} />
            <span className="truncate">{directoryName}</span>
          </Button>
        </Theater.Start>
        <Theater.Title>
          {current ? (
            <>
              <KindIcon kind={itemKindOf(current)} />
              <span className="truncate">{current.name}</span>
            </>
          ) : null}
          <span ref={setStatusSlot} className="flex shrink-0 items-center empty:hidden" />
        </Theater.Title>
        <Theater.End className="app-no-drag">
          {sequenced ? (
            <>
              <IconButton
                label="Previous"
                icon={ArrowLeft01Icon}
                shortcut={[PREVIOUS_KEY]}
                disabled={!showPrevious}
                onClick={showPrevious}
              />
              <IconButton
                label="Next"
                icon={ArrowRight01Icon}
                shortcut={[NEXT_KEY]}
                disabled={!showNext}
                onClick={showNext}
              />
              <Theater.Separator />
            </>
          ) : null}
          <InspectorToggle />
          <Theater.Close />
        </Theater.End>
      </Theater.Header>
      <div className="flex min-h-0 flex-1">
        <Theater.Stage>
          {current ? (
            <StatusSlot value={statusSlot}>
              <FileStage key={file.id} projectId={projectId} directory={directory} entry={current} />
            </StatusSlot>
          ) : null}
        </Theater.Stage>
        {inspector ? (
          <Inspector projectId={projectId} directory={directory} entry={current} className="mr-2 mb-2" />
        ) : null}
      </div>
    </Theater.Root>
  );
};
