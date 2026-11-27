import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { type Entry, type EntryRef, entryKey } from "@starlight/client";
import { Button, Icon, IconButton, Theater } from "@starlight/ui";
import { type KeyboardEvent, useEffect, useEffectEvent, useMemo, useRef } from "react";
import { useStarlight } from "../../lib/context.ts";
import { FileStage } from "./file-stage.tsx";
import { pictureUrl, presentationIcons, presentationOf } from "./presentation.ts";

interface Props {
  readonly workspaceId: string;
  readonly directory: EntryRef;
  readonly directoryName: string;
  readonly entries: ReadonlyArray<Entry>;
  readonly file: EntryRef;
  readonly onShow: (file: EntryRef) => void;
  readonly onClose: () => void;
}

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
      const presentation = presentationOf(entry.name);
      if (presentation === "none") continue;
      void queryClient.query(queries.fileSource(workspaceId, directory, entry.ref)).then(
        (source) => {
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
  const shownKey = entryKey(file);
  const index = files.findIndex((entry) => entryKey(entry.ref) === shownKey);
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
    ArrowLeft: showPrevious,
    ArrowRight: showNext,
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
          <Button onClick={onClose}>
            <Icon icon={ArrowLeft01Icon} />
            {directoryName}
          </Button>
        </Theater.Start>
        <Theater.Title>
          {current ? (
            <>
              <Icon icon={presentationIcons[presentationOf(current.name)]} className="text-subtle" />
              <span className="truncate">{current.name}</span>
              <span className="text-subtle tabular-nums">
                {(index + 1).toLocaleString()} / {files.length.toLocaleString()}
              </span>
            </>
          ) : null}
        </Theater.Title>
        <Theater.End className="app-no-drag">
          <IconButton
            label="Previous"
            icon={ArrowLeft01Icon}
            disabled={!showPrevious}
            onClick={showPrevious}
          />
          <IconButton label="Next" icon={ArrowRight01Icon} disabled={!showNext} onClick={showNext} />
          <Theater.Separator />
          <Theater.Close />
        </Theater.End>
      </Theater.Header>
      <Theater.Stage onPrevious={showPrevious} onNext={showNext}>
        {current ? (
          <FileStage key={shownKey} workspaceId={workspaceId} directory={directory} entry={current} />
        ) : null}
      </Theater.Stage>
    </Theater.Root>
  );
};
