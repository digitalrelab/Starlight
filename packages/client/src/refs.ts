import { EntryId, EntryRef, SourceId } from "@starlight/contracts";

export const entryRef = (source: string, id: string): EntryRef =>
  EntryRef.make({ source: SourceId.make(source), id: EntryId.make(id) });

export const entryKey = (ref: EntryRef) => JSON.stringify([ref.source, ref.id]);
