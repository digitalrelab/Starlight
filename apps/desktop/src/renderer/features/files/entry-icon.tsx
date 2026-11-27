import { previewUrl } from "#shared/previews.ts";
import { type ItemKind, KindIcon } from "./kind-icon.tsx";
import { usePreview } from "./use-preview.ts";

const PREVIEWED = new Set<ItemKind>(["image", "video"]);

interface EntryIconProps {
  readonly kind: ItemKind;
  readonly token: string | null;
  readonly size?: number;
}

const PreviewIcon = ({
  kind,
  token,
  size,
}: {
  readonly kind: ItemKind;
  readonly token: string;
  readonly size: number;
}) => {
  const { src } = usePreview(previewUrl(token, size * window.devicePixelRatio), true);
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

export const EntryIcon = ({ kind, token, size = 16 }: EntryIconProps) =>
  token !== null && PREVIEWED.has(kind) ? (
    <PreviewIcon kind={kind} token={token} size={size} />
  ) : (
    <KindIcon kind={kind} size={size} />
  );
