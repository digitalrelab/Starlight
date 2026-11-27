import type { DirectoryError, Entry, WorkspaceId } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import { FileSystemPort } from "./ports.ts";
import { joinRelative } from "./relative-path.ts";
import { Workspaces } from "./workspaces.ts";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const byKindThenName = (a: Entry, b: Entry) => {
  const aDir = a.kind === "directory" ? 0 : 1;
  const bDir = b.kind === "directory" ? 0 : 1;
  return aDir - bDir || collator.compare(a.name, b.name);
};

export class Entries extends Context.Service<
  Entries,
  {
    readonly list: (
      workspaceId: WorkspaceId,
      path: string,
    ) => Effect.Effect<ReadonlyArray<Entry>, DirectoryError>;
  }
>()("@starlight/core/Entries") {
  static readonly layer = Layer.effect(Entries)(
    Effect.gen(function* () {
      const fs = yield* FileSystemPort;
      const workspaces = yield* Workspaces;

      return Entries.of({
        list: Effect.fn("Entries.list")(function* (workspaceId, path) {
          const { absolute, relative } = yield* workspaces.resolveDirectory(workspaceId, path);
          const entries = yield* fs.readDirectory(absolute);
          return entries
            .map((entry): Entry => ({
              ...entry,
              path: joinRelative(relative, entry.name),
              hidden: entry.name.startsWith("."),
            }))
            .sort(byKindThenName);
        }),
      });
    }),
  );
}
