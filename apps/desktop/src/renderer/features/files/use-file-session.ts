import type { Codec, EntryRef, FileSource } from "@starlight/client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useStarlight } from "#renderer/lib/context.ts";
import { fileBytes } from "./file-bytes.ts";

export const useFileSession = <T>(projectId: string, file: EntryRef, source: FileSource, codec: Codec<T>) => {
  const { sessions, queryClient } = useStarlight();
  const [session] = useState(() =>
    sessions.file({ projectId, file, codec, load: (target) => queryClient.query(fileBytes(target)) }),
  );
  useEffect(() => session.receive(source), [session, source]);
  useEffect(() => () => session.flush(), [session]);
  return { session, ...useSyncExternalStore(session.subscribe, session.getSnapshot) };
};
