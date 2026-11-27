import type { Update } from "@starlight/contracts";
import { app } from "electron";
import electronUpdater, { type UpdateInfo } from "electron-updater";
import { Effect, Predicate, Stream, SubscriptionRef } from "effect";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

const toUpdate = ({ version, releaseNotes }: UpdateInfo, fields: Pick<Update, "status" | "progress">) => ({
  version,
  releaseNotes: typeof releaseNotes === "string" ? releaseNotes : "",
  ...fields,
});

export const startUpdater = () => {
  const state = Effect.runSync(SubscriptionRef.make<Update | null>(null));
  const current = () => SubscriptionRef.getUnsafe(state);
  const set = (update: Update) => Effect.runSync(SubscriptionRef.set(state, update));
  const patch = (fields: Partial<Update>) => {
    const update = current();
    if (update) set({ ...update, ...fields });
  };

  if (app.isPackaged) {
    const { autoUpdater } = electronUpdater;
    autoUpdater.autoDownload = false;
    autoUpdater.on("update-available", (info) => set(toUpdate(info, { status: "available", progress: 0 })));
    autoUpdater.on("download-progress", ({ percent }) => patch({ progress: percent / 100 }));
    autoUpdater.on("update-downloaded", (info) => set(toUpdate(info, { status: "downloaded", progress: 1 })));
    autoUpdater.on("error", () => {
      if (current()?.status === "downloading") patch({ status: "available", progress: 0 });
    });
    const check = () => {
      const status = current()?.status;
      if (status === "downloading" || status === "downloaded") return;
      autoUpdater.checkForUpdates().catch(() => null);
    };
    check();
    setInterval(check, CHECK_INTERVAL_MS);
  }

  return {
    updates: SubscriptionRef.changes(state).pipe(Stream.filter(Predicate.isNotNull)),
    download: () => {
      if (current()?.status !== "available") return;
      patch({ status: "downloading", progress: 0 });
      electronUpdater.autoUpdater.downloadUpdate().catch(() => null);
    },
    install: () => electronUpdater.autoUpdater.quitAndInstall(),
  };
};

export type Updater = ReturnType<typeof startUpdater>;
