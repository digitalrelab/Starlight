import { Schema } from "effect";
import { Actor } from "./actor.ts";

export const ConnectRequest = Schema.Struct({ actor: Actor });
export type ConnectRequest = typeof ConnectRequest.Type;
