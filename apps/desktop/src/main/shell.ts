import { EntryId, LocalSource, ShellRpcs } from "@starlight/contracts";
import { serve } from "@starlight/host/transport";
import { type BrowserWindow, dialog, type MessagePortMain } from "electron";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

const ShellServerLive = (window: BrowserWindow) =>
  RpcServer.layer(ShellRpcs).pipe(
    Layer.provide(
      ShellRpcs.toLayer({
        PickDirectory: () =>
          Effect.promise(() =>
            dialog.showOpenDialog(window, { properties: ["openDirectory", "createDirectory"] }),
          ).pipe(
            Effect.map(({ canceled, filePaths: [path] }) =>
              canceled || path === undefined ? null : { source: LocalSource, id: EntryId.make(path) },
            ),
          ),
      }),
    ),
  );

export const serveShell = (port: MessagePortMain, window: BrowserWindow) =>
  Effect.runFork(serve(port, ShellServerLive(window)));
