import { useEffect } from "react";
import { Channel } from "#shared/channels.ts";
import { defineStored, oneOf } from "#renderer/lib/storage.ts";

export const hiddenFiles = defineStored("hidden-files", oneOf(["hide", "show"]), "hide");

export const useHiddenFilesToggle = () =>
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.data?.type !== Channel.toggleHiddenFiles) return;
      hiddenFiles.set(hiddenFiles.get() === "show" ? "hide" : "show");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
