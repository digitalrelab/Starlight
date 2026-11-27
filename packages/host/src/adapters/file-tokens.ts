import { FileToken } from "@starlight/contracts";
import { FileTokens } from "@starlight/core";
import { Layer } from "effect";
import { issueFileToken } from "#file-token.ts";

export const FileTokensLive = (key: Buffer) =>
  Layer.succeed(FileTokens)({
    issue: (file) => FileToken.make(issueFileToken(key, file)),
  });
