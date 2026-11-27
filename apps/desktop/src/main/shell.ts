import { ShellRpcs } from "@starlight/contracts";
import { serve } from "@starlight/host/transport";
import { type BrowserWindow, dialog, type MessagePortMain } from "electron";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";
import type { Updater } from "./updater.ts";

const ShellServerLive = (window: BrowserWindow, updater: Updater) =>
  RpcServer.layer(ShellRpcs).pipe(
    Layer.provide(
      ShellRpcs.toLayer({
        PickDirectory: () =>
          Effect.promise(() =>
            dialog.showOpenDialog(window, { properties: ["openDirectory", "createDirectory"] }),
          ).pipe(Effect.map((result) => (result.canceled ? null : (result.filePaths[0] ?? null)))),
        WatchUpdates: () => updater.updates,
        DownloadUpdate: () => Effect.sync(updater.download),
        InstallUpdate: () => Effect.sync(updater.install),
      }),
    ),
  );

export const serveShell = (port: MessagePortMain, window: BrowserWindow, updater: Updater) =>
  Effect.runFork(serve(port, ShellServerLive(window, updater)));
