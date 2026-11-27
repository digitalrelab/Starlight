import type { FileSource } from "@starlight/client";
import { queryOptions } from "@tanstack/react-query";
import { fileUrl } from "../../../shared/files.ts";

export const fileBytes = ({ token }: FileSource) =>
  queryOptions({
    queryKey: ["fileBytes", token],
    queryFn: async ({ signal }) => {
      const response = await fetch(fileUrl(token), { signal });
      if (!response.ok) throw new Error(response.statusText);
      return new Uint8Array(await response.arrayBuffer());
    },
    staleTime: Infinity,
  });
