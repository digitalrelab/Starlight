import { DEFAULT_PLAYER_SETTINGS, parsePlayerSettings } from "@starlight/media-player";
import { defineStored, json } from "#renderer/lib/storage.ts";

export const playerSettings = defineStored("player", json(parsePlayerSettings), DEFAULT_PLAYER_SETTINGS);
