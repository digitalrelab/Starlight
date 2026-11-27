import { type FileSource, looksLikeText } from "@starlight/client";
import { queryOptions } from "@tanstack/react-query";
import { fileUrl } from "#shared/files.ts";

const SAMPLE_BYTES = 8192;
const RANGE_NOT_SATISFIABLE = 416;

export const fileIsText = ({ token }: FileSource) =>
  queryOptions({
    queryKey: ["fileIsText", token],
    queryFn: async ({ signal }) => {
      const response = await fetch(fileUrl(token), {
        signal,
        headers: { range: `bytes=0-${SAMPLE_BYTES - 1}` },
      });
      if (response.status === RANGE_NOT_SATISFIABLE) return true;
      if (!response.ok) throw new Error(response.statusText);
      return looksLikeText(new Uint8Array(await response.arrayBuffer()));
    },
    staleTime: Infinity,
  });
