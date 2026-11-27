import { FileToken } from "@starlight/contracts";
import { FileTokens, versionOf } from "@starlight/core";
import { Layer } from "effect";
import { issueFileToken } from "#file-token.ts";

export const FileTokensLive = (key: Buffer) =>
  Layer.succeed(FileTokens)({
    issue: (ref, entry) =>
      FileToken.make(issueFileToken(key, { ref, fileId: entry.fileId, version: versionOf(entry) })),
  });
