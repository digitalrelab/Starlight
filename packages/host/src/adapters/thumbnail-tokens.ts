import { ThumbnailToken } from "@starlight/contracts";
import { ThumbnailTokens } from "@starlight/core";
import { Layer } from "effect";
import { issueThumbnailToken } from "../thumbnail-token.ts";

export const ThumbnailTokensLive = (key: Buffer) =>
  Layer.succeed(ThumbnailTokens)({
    issue: (absolute, version) => ThumbnailToken.make(issueThumbnailToken(key, absolute, version)),
  });
