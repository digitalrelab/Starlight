import { type EntryRef, entryRef } from "@starlight/client";

export interface DirectorySearch {
  readonly source?: string;
  readonly entry?: string;
}

export const parseDirectorySearch = (search: Record<string, unknown>): DirectorySearch => {
  const { source, entry } = search;
  return typeof source === "string" && typeof entry === "string" ? { source, entry } : {};
};

export const toDirectory = ({ source, entry }: DirectorySearch): EntryRef | null =>
  source !== undefined && entry !== undefined ? entryRef(source, entry) : null;

export const toDirectorySearch = (directory: EntryRef | null): DirectorySearch =>
  directory ? { source: directory.source, entry: directory.id } : {};
