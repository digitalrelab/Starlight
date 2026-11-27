import type { FileSource } from "@starlight/client";
import { queryOptions } from "@tanstack/react-query";
import { fileUrl } from "../../../shared/files.ts";

export const loadEditor = () => import("@starlight/markdown/editor");

export const markdownText = ({ token }: FileSource) =>
  queryOptions({
    queryKey: ["markdownText", token],
    queryFn: async ({ signal }) => {
      const response = await fetch(fileUrl(token), { signal });
      if (!response.ok) throw new Error(response.statusText);
      return response.text();
    },
    staleTime: Infinity,
  });
