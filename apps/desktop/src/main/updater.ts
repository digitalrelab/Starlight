import type { Update } from "@starlight/contracts";
import { app } from "electron";
import electronUpdater from "electron-updater";
import { Effect, Predicate, Stream, SubscriptionRef } from "effect";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

export const startUpdater = () => {
  const downloaded = Effect.runSync(SubscriptionRef.make<Update | null>(null));

  if (app.isPackaged) {
    const { autoUpdater } = electronUpdater;
    autoUpdater.on("update-downloaded", ({ version, releaseNotes }) => {
      const notes = typeof releaseNotes === "string" ? releaseNotes : "";
      Effect.runSync(SubscriptionRef.set(downloaded, { version, releaseNotes: notes }));
    });
    const check = () => autoUpdater.checkForUpdates().catch(() => null);
    void check();
    setInterval(() => void check(), CHECK_INTERVAL_MS);
  }

  return {
    updates: SubscriptionRef.changes(downloaded).pipe(Stream.filter(Predicate.isNotNull)),
    install: () => electronUpdater.autoUpdater.quitAndInstall(),
  };
};

export type Updater = ReturnType<typeof startUpdater>;
