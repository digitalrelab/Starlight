import type { UpdaterState } from "@starlight/client";
import type { StatusTone } from "@starlight/ui";

export const updateStatus = ({
  enabled,
  checking,
  checkFailed,
  update,
}: UpdaterState): { readonly tone: StatusTone; readonly label: string } => {
  if (!enabled) return { tone: "neutral", label: "Development build" };
  if (update?.failure === "download") return { tone: "danger", label: "Download failed" };
  if (update?.failure === "install") return { tone: "danger", label: "Install failed" };
  if (update?.status === "available") return { tone: "brand", label: `${update.version} available` };
  if (update?.status === "downloading") return { tone: "brand", label: `Downloading ${update.version}` };
  if (update?.status === "downloaded") return { tone: "brand", label: "Ready to restart" };
  if (checking) return { tone: "neutral", label: "Checking…" };
  if (checkFailed) return { tone: "danger", label: "Couldn't check" };
  return { tone: "success", label: "Up to date" };
};
