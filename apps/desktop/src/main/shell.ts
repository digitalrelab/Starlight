import { ShellRpcs } from "@starlight/contracts";
import { serve } from "@starlight/host/transport";
import { type BrowserWindow, dialog, type MessagePortMain, nativeTheme } from "electron";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

const ShellServerLive = (window: BrowserWindow) =>
  RpcServer.layer(ShellRpcs).pipe(
    Layer.provide(
      ShellRpcs.toLayer({
        PickDirectory: () =>
          Effect.promise(() =>
            dialog.showOpenDialog(window, { properties: ["openDirectory", "createDirectory"] }),
          ).pipe(Effect.map((result) => (result.canceled ? null : (result.filePaths[0] ?? null)))),
        SetColorScheme: ({ colorScheme }) =>
          Effect.sync(() => {
            nativeTheme.themeSource = colorScheme;
          }),
      }),
    ),
  );

export const serveShell = (port: MessagePortMain, window: BrowserWindow) =>
  Effect.runFork(serve(port, ShellServerLive(window)));
