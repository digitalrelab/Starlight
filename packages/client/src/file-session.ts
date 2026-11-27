import { type EntryRef, type FileSource, type FileVersion, VersionConflict } from "@starlight/contracts";
import type { StarlightClient } from "./client.ts";
import type { Codec, Decoded } from "./codecs.ts";

const SAVE_DELAY_MS = 500;

export type FileSessionStatus = "loading" | "saved" | "dirty" | "saving" | "conflict" | "failed";

export interface FileDocument<T> {
  readonly value: T;
  readonly revision: number;
  readonly editable: boolean;
}

export interface FileSessionState<T> {
  readonly document: FileDocument<T> | undefined;
  readonly status: FileSessionStatus;
  readonly unsaved: boolean;
}

export interface FileSessionOptions<T> {
  readonly workspaceId: string;
  readonly file: EntryRef;
  readonly codec: Codec<T>;
  readonly load: (source: FileSource) => Promise<Uint8Array>;
}

export const createFileSession = <T>(
  client: StarlightClient,
  { workspaceId, file, codec, load }: FileSessionOptions<T>,
) => {
  const listeners = new Set<() => void>();
  let state: FileSessionState<T> = { document: undefined, status: "loading", unsaved: false };
  let disk: FileSource | undefined;
  let base: FileVersion | undefined;
  const superseded = new Set<FileVersion>();
  let decoded: Decoded<T> | undefined;
  let read: (() => T) | undefined;
  let edits = 0;
  let settled = 0;
  let loading: FileSource | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const unsaved = () => edits !== settled;

  const update = (next: Partial<Omit<FileSessionState<T>, "unsaved">>) => {
    state = { ...state, ...next, unsaved: unsaved() };
    for (const listener of listeners) listener();
  };

  const advance = (version: FileVersion) => {
    if (base !== undefined && base !== version) superseded.add(base);
    base = version;
  };

  const adopt = (source: FileSource, bytes: Uint8Array, remount: boolean) => {
    decoded = codec(bytes);
    advance(source.version);
    const diverged =
      read !== undefined && read() !== decoded.value && decoded.value === state.document?.value;
    read = undefined;
    settled = edits;
    const revision = (state.document?.revision ?? 0) + (remount || diverged ? 1 : 0);
    update({
      document: { value: decoded.value, revision, editable: decoded.encode !== undefined },
      status: "saved",
    });
  };

  const reconcile = async (): Promise<void> => {
    const target = disk;
    if (!target || target.version === base || superseded.has(target.version) || loading === target) return;
    if (state.status === "saving" || state.status === "conflict") return;
    if (unsaved()) return update({ status: "conflict" });
    loading = target;
    const bytes = await load(target).catch(() => undefined);
    loading = undefined;
    if (disk !== target || unsaved()) return reconcile();
    if (!bytes) return update({ status: "failed" });
    adopt(target, bytes, false);
  };

  const save = async () => {
    clearTimeout(timer);
    timer = undefined;
    const encode = decoded?.encode;
    if (state.status !== "dirty" || !read || !encode || base === undefined) return;
    const startedAt = edits;
    update({ status: "saving" });
    try {
      advance(await client.files.write(workspaceId, file, encode(read()), base));
      settled = startedAt;
      update({ status: edits === startedAt ? "saved" : "dirty" });
      if (edits !== startedAt) schedule();
    } catch (error) {
      update({ status: error instanceof VersionConflict ? "conflict" : "failed" });
    }
    await reconcile();
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(save, SAVE_DELAY_MS);
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    receive: (source: FileSource) => {
      if (superseded.has(source.version)) return;
      disk = source;
      void reconcile();
    },
    edit: (reader: () => T) => {
      read = reader;
      edits++;
      if (state.status === "saved" || state.status === "failed") update({ status: "dirty" });
      schedule();
    },
    flush: () => {
      if (timer !== undefined) void save();
    },
    retry: () => {
      if (!unsaved()) return void reconcile();
      update({ status: "dirty" });
      void save();
    },
    keepMine: () => {
      if (disk) advance(disk.version);
      update({ status: "dirty" });
      void save();
    },
    takeTheirs: async () => {
      const target = disk;
      if (!target) return;
      const bytes = await load(target).catch(() => undefined);
      if (bytes && disk === target) adopt(target, bytes, true);
    },
  };
};

export type FileSession<T> = ReturnType<typeof createFileSession<T>>;
