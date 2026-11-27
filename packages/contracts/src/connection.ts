import { Schema } from "effect";
import { Actor } from "./actor.ts";

export const HostChannel = Schema.Union([
  Schema.TaggedStruct("Client", { actor: Actor }),
  Schema.TaggedStruct("Imaging", {}),
]);
export type HostChannel = typeof HostChannel.Type;
