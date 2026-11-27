import type { Entry, FileSource } from "@starlight/client";
import { queryOptions } from "@tanstack/react-query";
import { fileUrl } from "../../../shared/files.ts";

const MAX_DOCUMENT_BYTES = 16 * 1024 ** 2;

export const isReadable = (entry: Entry) => entry.size <= MAX_DOCUMENT_BYTES;

export const loadEditor = () => import("@starlight/markdown/editor");

export const documentText = ({ token }: FileSource) =>
  queryOptions({
    queryKey: ["documentText", token],
    queryFn: async ({ signal }) => {
      const response = await fetch(fileUrl(token), { signal });
      if (!response.ok) throw new Error(`Couldn't read the file (${response.status})`);
      return response.text();
    },
    staleTime: Infinity,
  });
