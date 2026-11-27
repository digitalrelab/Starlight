import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry, EntryRef } from "@starlight/client";
import { Button, Icon, IconButton, Theater } from "@starlight/ui";
import { type KeyboardEvent, useEffect, useEffectEvent, useMemo, useRef } from "react";
import { KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { FileStage } from "./file-stage.tsx";
import { loadEditor, markdownText } from "./markdown-file.ts";
import { pictureUrl, presentationOf } from "./presentation.ts";

interface Props {
  readonly workspaceId: string;
  readonly directory: EntryRef;
  readonly directoryName: string;
  readonly entries: ReadonlyArray<Entry>;
  readonly file: EntryRef;
  readonly onShow: (file: EntryRef) => void;
  readonly onClose: () => void;
}

const PREVIOUS_KEY = "ArrowLeft";
const NEXT_KEY = "ArrowRight";

const isKeyConsumed = (event: KeyboardEvent) =>
  event.defaultPrevented ||
  event.altKey ||
  event.ctrlKey ||
  event.metaKey ||
  event.shiftKey ||
  event.target instanceof HTMLMediaElement;

const usePrefetch = (
  workspaceId: string,
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
      void queryClient.query(queries.fileSource(workspaceId, directory, entry.ref)).then(
        (source) => {
          if (presentation === "markdown") {
            void loadEditor();
            return queryClient.prefetchQuery(markdownText(source));
          }
          if (presentation !== "video") new Image().src = pictureUrl(source, presentation);
        },
        () => undefined,
      );
    }
  }, [queryClient, queries, workspaceId, directory, previous, next]);
};

export const FileViewer = ({
  workspaceId,
  directory,
  directoryName,
  entries,
  file,
  onShow,
  onClose,
}: Props) => {
  const files = useMemo(() => entries.filter((entry) => entry.kind === "file"), [entries]);
  const sequenced = files.length > 1;
  const index = files.findIndex(({ ref }) => ref.id === file.id && ref.source === file.source);
  const current = files[index];
  const previous = index > 0 ? files[index - 1] : undefined;
  const next = index >= 0 ? files[index + 1] : undefined;
  usePrefetch(workspaceId, directory, previous, next);

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
          <Theater.Close />
        </Theater.End>
      </Theater.Header>
      <Theater.Stage>
        {current ? (
          <FileStage key={file.id} workspaceId={workspaceId} directory={directory} entry={current} />
        ) : null}
      </Theater.Stage>
    </Theater.Root>
  );
};
