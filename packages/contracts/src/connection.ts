import { Schema } from "effect";
import { Actor } from "./actor.ts";

/** Sent by the Electron main process to the host, with a MessagePort attached. */
export const ConnectRequest = Schema.Struct({ actor: Actor });
export type ConnectRequest = typeof ConnectRequest.Type;
