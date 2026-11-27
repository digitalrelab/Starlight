import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { app, BrowserWindow, ipcMain, MessageChannelMain, protocol } from "electron";
import { Channel } from "../shared/channels.ts";
import { superviseHost } from "./host.ts";
import { serveShell } from "./shell.ts";
import { fileScheme, serveFiles } from "./files.ts";
import { installMenu } from "./menu.ts";
import { openPreviewCache, previewScheme, servePreviews } from "./previews.ts";
import { startUpdater } from "./updater.ts";
import { createWindow } from "./window.ts";

if (!app.isPackaged) app.setPath("userData", join(app.getAppPath(), ".data"));
protocol.registerSchemesAsPrivileged([previewScheme, fileScheme]);

const main = async () => {
  await app.whenReady();
  installMenu();
  const fileKey = randomBytes(32);
  const previews = openPreviewCache();
  servePreviews(fileKey, previews);
  serveFiles(fileKey);
  const host = superviseHost({ STARLIGHT_FILE_KEY: fileKey.toString("hex") }, () => {
    for (const window of BrowserWindow.getAllWindows()) window.webContents.reload();
  });
  const updater = startUpdater();

  ipcMain.on(Channel.connect, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || event.senderFrame !== event.sender.mainFrame) return;

    const toHost = new MessageChannelMain();
    host.connect({ actor: { _tag: "User" } }, toHost.port1);
    const toShell = new MessageChannelMain();
    serveShell(toShell.port1, window, updater, previews);
    event.sender.postMessage(Channel.ports, null, [toHost.port2, toShell.port2]);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("will-quit", host.stop);
};

void main();
