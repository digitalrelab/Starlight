import type { ConnectRequest } from "@starlight/contracts";
import { app, BrowserWindow, ipcMain, MessageChannelMain } from "electron";
import { startHost } from "./host.ts";
import { serveShell } from "./shell.ts";
import { createWindow } from "./window.ts";

const main = async () => {
  await app.whenReady();
  const host = startHost();

  ipcMain.on("starlight:connect", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || event.senderFrame !== event.sender.mainFrame) return;

    const toHost = new MessageChannelMain();
    host.postMessage({ actor: { _tag: "User" } } satisfies ConnectRequest, [toHost.port1]);

    const toShell = new MessageChannelMain();
    serveShell(toShell.port1, window);

    event.sender.postMessage("starlight:ports", null, [toHost.port2, toShell.port2]);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("will-quit", () => {
    host.kill();
  });
};

void main();
