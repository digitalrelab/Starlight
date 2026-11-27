import { PlayIcon } from "@hugeicons-pro/core-solid-rounded";
import { RefreshCcwIcon } from "@hugeicons-pro/core-stroke-rounded";
import { cn, Icon, Spinner } from "@starlight/ui";
import { type ReactNode, useEffect, useState } from "react";
import { EchoView } from "./echo.tsx";
import { usePlayer } from "./engine.tsx";
import type { Status } from "./status.ts";

const LOADING_DELAY_MS = 400;

type Face = "play" | "loading" | "replay";

const FACES: Partial<Record<Status, Face>> = { idle: "play", loading: "loading", ended: "replay" };

const APPEARANCES: Record<Face, { readonly label: string; readonly glyph: ReactNode }> = {
  play: { label: "Play", glyph: <Icon icon={PlayIcon} size={28} className="translate-x-px" /> },
  loading: { label: "Loading", glyph: <Spinner size={30} className="text-default" /> },
  replay: { label: "Replay", glyph: <Icon icon={RefreshCcwIcon} size={28} /> },
};

const useDelayedLoading = (status: Status | null) => {
  const [shown, setShown] = useState<Status | null>(status === "loading" ? null : status);
  if (status !== "loading" && status !== shown) setShown(status);

  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => setShown("loading"), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status]);

  return shown;
};

const useLingeringFace = (face: Face | null) => {
  const [last, setLast] = useState<Face>(face ?? "play");
  if (face !== null && face !== last) setLast(face);
  return face ?? last;
};

const Disc = ({ face, isVisible }: { readonly face: Face; readonly isVisible: boolean }) => {
  const { togglePlayback } = usePlayer();
  const isActionable = isVisible && face !== "loading";
  return (
    <button
      type="button"
      aria-label={APPEARANCES[face].label}
      inert={!isActionable}
      data-hidden={!isVisible || undefined}
      className={cn(
        "grid size-16 place-items-center rounded-full bg-surface-overlay text-default shadow-overlay",
        "transition-[opacity,scale,display] transition-discrete duration-200 ease-out starting:scale-96 starting:opacity-0",
        "highlighted:bg-neutral-subtle-hovered data-hidden:hidden data-hidden:scale-96 data-hidden:opacity-0",
        isActionable && "pointer-events-auto",
      )}
      onClick={togglePlayback}
    >
      {APPEARANCES[face].glyph}
    </button>
  );
};

export const Center = ({
  failure,
  className,
}: {
  readonly failure: ReactNode;
  readonly className?: string;
}) => {
  const { status, echo } = usePlayer();
  const shown = useDelayedLoading(status);
  const face = shown === null ? null : (FACES[shown] ?? null);
  const lingering = useLingeringFace(face);

  return (
    <div className={cn("pointer-events-none grid place-items-center *:col-start-1 *:row-start-1", className)}>
      {shown === "failed" ? (
        <div className="flex flex-col items-center gap-3 text-subtle">{failure}</div>
      ) : (
        <Disc face={lingering} isVisible={face !== null} />
      )}
      <EchoView echo={echo} />
    </div>
  );
};
