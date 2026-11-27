import { LocalSource } from "@starlight/contracts";
import { type FileClaim, verifyFileToken } from "@starlight/host/file-token";
import { protocol } from "electron";

interface LocalFile extends Omit<FileClaim, "ref"> {
  readonly path: string;
}

export const serveLocalFiles = (
  scheme: string,
  key: Buffer,
  serve: (file: LocalFile, request: Request) => Promise<Response>,
) =>
  protocol.handle(scheme, (request) => {
    const claim = verifyFileToken(key, new URL(request.url).pathname.slice(1));
    if (!claim) return new Response(null, { status: 403 });
    if (claim.ref.source !== LocalSource) return new Response(null, { status: 404 });
    const { ref, ...file } = claim;
    return serve({ ...file, path: ref.id }, request).catch(() => new Response(null, { status: 404 }));
  });
