import type { Entry, EntryRef, FileSource } from "@starlight/client";
import { cn, ScrollArea } from "@starlight/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ReactNode, Suspense, useState } from "react";
import { fileUrl } from "../../../shared/files.ts";
import { previewUrl } from "../../../shared/previews.ts";
import { useStarlight } from "../../lib/context.ts";
import { reveal } from "../../lib/reveal.ts";
import { type ItemKind, KindIcon, itemKindOf } from "../files/kind-icon.tsx";
import { MarkdownEditor, markdownText } from "./markdown-file.ts";
import { pictureUrl, presentationOf } from "./presentation.ts";

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

const Video = ({ source }: { readonly source: FileSource }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <Notice kind="video">Can’t play this video</Notice>;
  return (
    <div className="flex size-full items-center justify-center">
      <video
        src={fileUrl(source.token)}
        poster={previewUrl(source.token, POSTER_PIXELS)}
        controls
        autoPlay
        onError={() => setFailed(true)}
        className="max-h-full max-w-full"
      />
    </div>
  );
};

const MarkdownFile = ({ name, source }: { readonly name: string; readonly source: FileSource }) => {
  const text = useQuery({ ...markdownText(source), placeholderData: keepPreviousData });
  if (text.isError) return <Notice kind="markdown">Can’t open this file</Notice>;
  if (text.data === undefined) return null;
  return (
    <ScrollArea className="h-full">
      <Suspense fallback={null}>
        <MarkdownEditor value={text.data} label={name} className="pt-[12vh] pb-[40vh]" />
      </Suspense>
    </ScrollArea>
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
  if (presentation === "markdown") return <MarkdownFile name={entry.name} source={source.data} />;
  return <Picture name={entry.name} source={source.data} presentation={presentation} />;
};
