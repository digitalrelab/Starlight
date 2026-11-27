import { cn } from "cn";
import type { ReactNode } from "react";
import { Center } from "./center.tsx";
import { usePlayer } from "./engine.tsx";

const fit = "size-full object-contain";

export const Surface = ({
  poster,
  failure,
}: {
  readonly poster: string | undefined;
  readonly failure: ReactNode;
}) => {
  const { src, state, attachMedia, togglePlayback } = usePlayer();
  return (
    <>
      {poster ? (
        <img
          src={poster}
          alt=""
          draggable={false}
          className={cn(
            fit,
            "absolute inset-0 transition-opacity duration-150",
            state.started && state.hasFrame && !state.failed && "opacity-0",
          )}
          onClick={togglePlayback}
        />
      ) : null}
      <video
        ref={attachMedia}
        src={src}
        className={cn(fit, "relative transition-opacity duration-300", state.ended && "opacity-40")}
        onClick={togglePlayback}
      />
      <Center failure={failure} className="absolute inset-0" />
    </>
  );
};
