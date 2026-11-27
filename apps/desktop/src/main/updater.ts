import type { Update, UpdaterState } from "@starlight/contracts";
import { app } from "electron";
import electronUpdater, { type UpdateInfo } from "electron-updater";
import { Effect, SubscriptionRef } from "effect";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const MIN_CHECK_GAP_MS = 5 * 60 * 1000;

const toUpdate = ({ version, releaseNotes }: UpdateInfo, fields: Pick<Update, "status" | "progress">) => ({
  version,
  releaseNotes: typeof releaseNotes === "string" ? releaseNotes : "",
  failure: null,
  ...fields,
});

export const startUpdater = () => {
  const state = Effect.runSync(
    SubscriptionRef.make<UpdaterState>({
      version: app.getVersion(),
      enabled: app.isPackaged,
      checking: false,
      checkedAt: null,
      checkFailed: false,
      update: null,
    }),
  );
  const current = () => SubscriptionRef.getUnsafe(state);
  const patch = (fields: Partial<UpdaterState>) =>
    Effect.runSync(SubscriptionRef.set(state, { ...current(), ...fields }));
  const patchUpdate = (fields: Partial<Update>) => {
    const { update } = current();
    if (update) patch({ update: { ...update, ...fields } });
  };

  let attemptedAt = 0;
  const check = (force: boolean) => {
    const { enabled, checking, update } = current();
    if (!enabled || checking || update?.status === "downloading" || update?.status === "downloaded") return;
    if (!force && Date.now() - attemptedAt < MIN_CHECK_GAP_MS) return;
    attemptedAt = Date.now();
    patch({ checking: true, checkFailed: false });
    electronUpdater.autoUpdater
      .checkForUpdates()
      .then(() => patch({ checking: false, checkedAt: Date.now() }))
      .catch(() => patch({ checking: false, checkFailed: true }));
  };

  if (app.isPackaged) {
    const { autoUpdater } = electronUpdater;
    autoUpdater.autoDownload = false;
    autoUpdater.on("update-available", (info) =>
      patch({ update: toUpdate(info, { status: "available", progress: 0 }) }),
    );
    autoUpdater.on("download-progress", ({ percent }) => patchUpdate({ progress: percent / 100 }));
    autoUpdater.on("update-downloaded", (info) =>
      patch({ update: toUpdate(info, { status: "downloaded", progress: 1 }) }),
    );
    autoUpdater.on("error", () => {
      const status = current().update?.status;
      if (status === "downloading") patchUpdate({ status: "available", progress: 0, failure: "download" });
      if (status === "downloaded") patchUpdate({ failure: "install" });
    });
    check(false);
    setInterval(() => check(false), CHECK_INTERVAL_MS);
    app.on("browser-window-focus", () => check(false));
  }

  return {
    state: SubscriptionRef.changes(state),
    check: () => check(true),
    download: () => {
      if (current().update?.status !== "available") return;
      patchUpdate({ status: "downloading", progress: 0, failure: null });
      electronUpdater.autoUpdater.downloadUpdate().catch(() => null);
    },
    install: () => {
      patchUpdate({ failure: null });
      electronUpdater.autoUpdater.quitAndInstall();
    },
  };
};

export type Updater = ReturnType<typeof startUpdater>;
