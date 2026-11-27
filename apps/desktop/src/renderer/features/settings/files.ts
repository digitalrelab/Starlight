import { useEffect } from "react";
import { Channel } from "#shared/channels.ts";
import { onMainMessage } from "#renderer/lib/main-messages.ts";
import { defineStored, oneOf } from "#renderer/lib/storage.ts";

export const hiddenFiles = defineStored("hidden-files", oneOf(["hide", "show"]), "hide");

export const useHiddenFilesToggle = () =>
  useEffect(
    () =>
      onMainMessage(Channel.toggleHiddenFiles, () =>
        hiddenFiles.set(hiddenFiles.get() === "show" ? "hide" : "show"),
      ),
    [],
  );
