import { previewUrl } from "#shared/previews.ts";
import { type ItemKind, KindIcon } from "./kind-icon.tsx";
import { usePreview } from "./use-preview.ts";

interface EntryIconProps {
  readonly kind: ItemKind;
  readonly preview: string | null;
  readonly size?: number;
}

const PreviewIcon = ({
  kind,
  preview,
  size,
}: EntryIconProps & { readonly preview: string; readonly size: number }) => {
  const { src } = usePreview(previewUrl(preview, size * window.devicePixelRatio), true);
  return src ? (
    <img
      alt=""
      src={src}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-xs object-cover"
    />
  ) : (
    <KindIcon kind={kind} size={size} />
  );
};

export const EntryIcon = ({ kind, preview, size = 16 }: EntryIconProps) =>
  preview === null ? (
    <KindIcon kind={kind} size={size} />
  ) : (
    <PreviewIcon kind={kind} preview={preview} size={size} />
  );
