import { type EntryRef, entryRef } from "@starlight/client";

export interface DirectorySearch {
  readonly source?: string;
  readonly entry?: string;
  readonly file?: string;
}

export const parseDirectorySearch = (search: Record<string, unknown>): DirectorySearch => {
  const { source, entry, file } = search;
  if (typeof source !== "string" || typeof entry !== "string") return {};
  return typeof file === "string" ? { source, entry, file } : { source, entry };
};

export const toDirectory = ({ source, entry }: DirectorySearch): EntryRef | null =>
  source !== undefined && entry !== undefined ? entryRef(source, entry) : null;

export const toFile = ({ source, file }: DirectorySearch): EntryRef | null =>
  source !== undefined && file !== undefined ? entryRef(source, file) : null;

export const toDirectorySearch = (directory: EntryRef | null): DirectorySearch =>
  directory ? { source: directory.source, entry: directory.id } : {};

export const toFileSearch = (directory: EntryRef, file: EntryRef): DirectorySearch => ({
  ...toDirectorySearch(directory),
  file: file.id,
});
