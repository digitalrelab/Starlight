import { LocalSource } from "@starlight/contracts";
import { verifyFileToken } from "@starlight/host/file-token";
import { protocol } from "electron";

export const serveLocalFiles = (
  scheme: string,
  key: Buffer,
  serve: (path: string, request: Request) => Promise<Response>,
) =>
  protocol.handle(scheme, (request) => {
    const ref = verifyFileToken(key, new URL(request.url).pathname.slice(1));
    if (!ref) return new Response(null, { status: 403 });
    if (ref.source !== LocalSource) return new Response(null, { status: 404 });
    return serve(ref.id, request).catch(() => new Response(null, { status: 404 }));
  });
