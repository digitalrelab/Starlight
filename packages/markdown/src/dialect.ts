import { GFM, parser as commonmark } from "@lezer/markdown";

export const extensions = [GFM];

export const parser = commonmark.configure(extensions);
