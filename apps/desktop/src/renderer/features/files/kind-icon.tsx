import {
  Archive01Icon,
  AudioWave01Icon,
  CubeIcon,
  File01Icon,
  File02Icon,
  Folder01Icon,
  GridTableIcon,
  Image01Icon,
  Pdf01Icon,
  PenTool03Icon,
  PresentationBarChart01Icon,
  TextFontIcon,
  Video01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { type Entry, type FileKind, fileKindOf } from "@starlight/client";
import { cn, Icon, type IconProps } from "@starlight/ui";
import { MarkdownIcon } from "./markdown-icon.ts";

export type ItemKind = "folder" | FileKind;

const KINDS: Readonly<Record<ItemKind, { readonly icon: IconProps["icon"]; readonly className: string }>> = {
  folder: { icon: Folder01Icon, className: "text-accent-blue" },
  image: { icon: Image01Icon, className: "text-accent-green" },
  video: { icon: Video01Icon, className: "text-accent-pink" },
  audio: { icon: AudioWave01Icon, className: "text-accent-purple" },
  pdf: { icon: Pdf01Icon, className: "text-accent-red" },
  document: { icon: File02Icon, className: "text-accent-cyan" },
  markdown: { icon: MarkdownIcon, className: "text-default" },
  spreadsheet: { icon: GridTableIcon, className: "text-accent-teal" },
  presentation: { icon: PresentationBarChart01Icon, className: "text-accent-orange" },
  design: { icon: PenTool03Icon, className: "text-accent-magenta" },
  archive: { icon: Archive01Icon, className: "text-accent-yellow" },
  font: { icon: TextFontIcon, className: "text-accent-indigo" },
  "3d": { icon: CubeIcon, className: "text-accent-lime" },
  other: { icon: File01Icon, className: "text-accent-gray" },
};

export const itemKindOf = (entry: Entry): ItemKind =>
  entry.kind === "directory" ? "folder" : fileKindOf(entry.name);

interface KindIconProps extends Omit<IconProps, "icon"> {
  readonly kind: ItemKind;
}

export const KindIcon = ({ kind, className, ...props }: KindIconProps) => (
  <Icon icon={KINDS[kind].icon} className={cn(KINDS[kind].className, className)} {...props} />
);
