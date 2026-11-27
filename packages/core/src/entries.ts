import {
  type Entry,
  type FileSystemError,
  NotADirectory,
  type PathOutsideWorkspace,
  type WorkspaceId,
  type WorkspaceNotFound,
} from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import { FileSystemPort } from "./ports.ts";
import { Workspaces } from "./workspaces.ts";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const byKindThenName = (a: Entry, b: Entry) => {
  const aDir = a.kind === "directory" ? 0 : 1;
  const bDir = b.kind === "directory" ? 0 : 1;
  return aDir - bDir || collator.compare(a.name, b.name);
};

const join = (parent: string, name: string) => (parent === "" ? name : `${parent}/${name}`);

export class Entries extends Context.Service<
  Entries,
  {
    readonly list: (
      workspaceId: WorkspaceId,
      path: string,
    ) => Effect.Effect<
      ReadonlyArray<Entry>,
      WorkspaceNotFound | PathOutsideWorkspace | NotADirectory | FileSystemError
    >;
  }
>()("@starlight/core/Entries") {
  static readonly layer = Layer.effect(Entries)(
    Effect.gen(function* () {
      const fs = yield* FileSystemPort;
      const workspaces = yield* Workspaces;

      return Entries.of({
        list: Effect.fn("Entries.list")(function* (workspaceId, path) {
          const { absolute, relative } = yield* workspaces.resolve(workspaceId, path);
          const info = yield* fs.stat(absolute);
          if (info.kind !== "directory") return yield* new NotADirectory({ path: relative });
          const entries = yield* fs.readDirectory(absolute);
          return entries
            .map((entry): Entry => ({
              ...entry,
              path: join(relative, entry.name),
              hidden: entry.name.startsWith("."),
            }))
            .sort(byKindThenName);
        }),
      });
    }),
  );
}
