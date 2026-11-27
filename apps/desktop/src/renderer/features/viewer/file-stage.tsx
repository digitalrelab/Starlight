import { type Entry, type EntryRef, type FileSource, textCodec } from "@starlight/client";
import { MediaPlayer } from "@starlight/media-player";
import { cn, ScrollArea } from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, Suspense, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { fileUrl } from "#shared/files.ts";
import { previewUrl } from "#shared/previews.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { reveal } from "#renderer/lib/reveal.ts";
import { FileSessionBanner } from "#renderer/features/files/file-session-banner.tsx";
import { type ItemKind, KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { UnsavedDot } from "#renderer/features/files/unsaved-dot.tsx";
import { useFileSession } from "#renderer/features/files/use-file-session.ts";
import { MarkdownEditor } from "./markdown-file.ts";
import { pictureUrl, presentationOf } from "./presentation.ts";
import { StatusSlot } from "./status-slot.ts";

const PLACEHOLDER_PIXELS = 512;
const POSTER_PIXELS = 1024;

const fill = "absolute inset-0 size-full object-contain";

const Notice = ({ kind, children }: { readonly kind: ItemKind; readonly children: ReactNode }) => (
  <div className="flex size-full flex-col items-center justify-center gap-3 text-subtle">
    <KindIcon kind={kind} size={40} />
    <p>{children}</p>
  </div>
);

interface PictureProps {
  readonly name: string;
  readonly source: FileSource;
  readonly presentation: "image" | "preview";
}

const Picture = ({ name, source, presentation }: PictureProps) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <Notice kind="image">Can’t open this image</Notice>;
  return (
    <div
      className="group/fitted absolute inset-0 m-auto"
      style={
        source.dimensions
          ? { maxWidth: source.dimensions.width, maxHeight: source.dimensions.height }
          : undefined
      }
    >
      <img
        src={previewUrl(source.token, PLACEHOLDER_PIXELS)}
        alt=""
        draggable={false}
        className={cn(fill, "group-has-data-loaded/fitted:invisible")}
      />
      <img
        src={pictureUrl(source, presentation)}
        alt={name}
        decoding="async"
        draggable={false}
        onLoad={reveal}
        onError={() => setFailed(true)}
        className={cn(fill, "invisible data-loaded:visible")}
      />
    </div>
  );
};

const Video = ({ source }: { readonly source: FileSource }) => (
  <MediaPlayer.Video
    src={fileUrl(source.token)}
    poster={previewUrl(source.token, POSTER_PIXELS)}
    autoPlay
    hasPageShortcuts
    failure={
      <>
        <KindIcon kind="video" size={40} />
        <p>Can’t play this video</p>
      </>
    }
    className="size-full"
  />
);

interface MarkdownFileProps {
  readonly workspaceId: string;
  readonly entry: Entry;
  readonly source: FileSource;
}

const MarkdownFile = ({ workspaceId, entry, source }: MarkdownFileProps) => {
  const { session, document, status, unsaved } = useFileSession(workspaceId, entry.ref, source, textCodec);
  const statusSlot = useContext(StatusSlot);
  if (!document) return status === "failed" ? <Notice kind="markdown">Can’t open this file</Notice> : null;
  return (
    <>
      <FileSessionBanner status={status} session={session} />
      {unsaved && statusSlot ? createPortal(<UnsavedDot />, statusSlot) : null}
      <ScrollArea className="h-full">
        <Suspense fallback={null}>
          <MarkdownEditor
            key={document.revision}
            value={document.value}
            label={entry.name}
            editable={document.editable}
            onChange={session.edit}
            className="pt-[12vh] pb-[40vh]"
          />
        </Suspense>
      </ScrollArea>
    </>
  );
};

interface Props {
  readonly workspaceId: string;
  readonly directory: EntryRef;
  readonly entry: Entry;
}

export const FileStage = ({ workspaceId, directory, entry }: Props) => {
  const { queries } = useStarlight();
  const presentation = presentationOf(entry);
  const source = useQuery({
    ...queries.fileSource(workspaceId, directory, entry.ref),
    enabled: presentation !== "none",
  });
  if (presentation === "none") return <Notice kind={itemKindOf(entry)}>No preview available</Notice>;
  if (source.isError) return <Notice kind={itemKindOf(entry)}>Can’t open this file</Notice>;
  if (!source.data) return null;
  if (presentation === "video") return <Video source={source.data} />;
  if (presentation === "markdown")
    return <MarkdownFile workspaceId={workspaceId} entry={entry} source={source.data} />;
  return <Picture name={entry.name} source={source.data} presentation={presentation} />;
};
