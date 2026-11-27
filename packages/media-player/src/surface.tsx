import { cn } from "cn";
import { usePlayer } from "./engine.tsx";
import { Visualizer } from "./visualizer.tsx";

const fit = "size-full object-contain";

export const VideoSurface = ({ poster }: { readonly poster: string | undefined }) => {
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
        crossOrigin="anonymous"
        className={cn(fit, "relative transition-opacity duration-300", state.ended && "opacity-40")}
        onClick={togglePlayback}
      />
    </>
  );
};

export const AudioSurface = () => {
  const { src, media, state, attachMedia, togglePlayback } = usePlayer();
  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center p-6 pb-24" onClick={togglePlayback}>
        {media && !state.failed ? (
          <Visualizer
            media={media}
            active={!state.paused}
            bars={15}
            className="h-40 w-full max-w-lg gap-3 text-subtle"
          />
        ) : null}
      </div>
      <audio ref={attachMedia} src={src} crossOrigin="anonymous" />
    </>
  );
};
