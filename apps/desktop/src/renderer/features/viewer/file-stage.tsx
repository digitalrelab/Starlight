import type { Entry, EntryRef, FileSource } from "@starlight/client";
import { cn, Icon, type IconProps } from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
import { lazy, type ReactNode, Suspense, useState } from "react";
import { fileUrl } from "../../../shared/files.ts";
import { thumbnailUrl } from "../../../shared/thumbnails.ts";
import { useStarlight } from "../../lib/context.ts";
import { reveal } from "../../lib/reveal.ts";
import { isTooLarge, loadEditor, markdownText } from "./markdown-file.ts";
import { pictureUrl, presentationIcons, presentationOf } from "./presentation.ts";

const MarkdownEditor = lazy(() => loadEditor().then(({ MarkdownEditor }) => ({ default: MarkdownEditor })));

const PLACEHOLDER_PIXELS = 512;
const POSTER_PIXELS = 1024;

const fill = "absolute inset-0 size-full object-contain";

const Notice = ({ icon, children }: { readonly icon: IconProps["icon"]; readonly children: ReactNode }) => (
  <div className="flex size-full flex-col items-center justify-center gap-3 text-subtle">
    <Icon icon={icon} size={40} strokeWidth={1.25} />
    <p>{children}</p>
  </div>
);

interface PictureProps {
  readonly name: string;
  readonly source: FileSource;
  readonly presentation: "image" | "rendition";
}

const Picture = ({ name, source, presentation }: PictureProps) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <Notice icon={presentationIcons.image}>Can’t open this image</Notice>;
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
        src={thumbnailUrl(source.token, PLACEHOLDER_PIXELS)}
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
  if (failed) return <Notice icon={presentationIcons.video}>Can’t play this video</Notice>;
  return (
    <div className="flex size-full items-center justify-center">
      <video
        src={fileUrl(source.token)}
        poster={thumbnailUrl(source.token, POSTER_PIXELS)}
        controls
        autoPlay
        onError={() => setFailed(true)}
        className="max-h-full max-w-full"
      />
    </div>
  );
};

const MarkdownFile = ({ name, source }: { readonly name: string; readonly source: FileSource }) => {
  const text = useQuery({ ...markdownText(source), placeholderData: (previous) => previous });
  if (text.isError) return <Notice icon={presentationIcons.markdown}>Can’t open this file</Notice>;
  if (text.data === undefined) return null;
  return (
    <Suspense fallback={null}>
      <MarkdownEditor value={text.data} label={name} className="absolute inset-0" />
    </Suspense>
  );
};

interface Props {
  readonly workspaceId: string;
  readonly directory: EntryRef;
  readonly entry: Entry;
}

export const FileStage = ({ workspaceId, directory, entry }: Props) => {
  const { queries } = useStarlight();
  const presentation = presentationOf(entry.name);
  const isOversized = presentation === "markdown" && isTooLarge(entry);
  const source = useQuery({
    ...queries.fileSource(workspaceId, directory, entry.ref),
    enabled: presentation !== "none" && !isOversized,
  });
  if (presentation === "none") return <Notice icon={presentationIcons.none}>No preview available</Notice>;
  if (isOversized) return <Notice icon={presentationIcons.markdown}>Too large to preview</Notice>;
  if (source.isError) return <Notice icon={presentationIcons[presentation]}>Can’t open this file</Notice>;
  if (!source.data) return null;
  if (presentation === "video") return <Video source={source.data} />;
  if (presentation === "markdown") return <MarkdownFile name={entry.name} source={source.data} />;
  return <Picture name={entry.name} source={source.data} presentation={presentation} />;
};
