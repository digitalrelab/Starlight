import type { FileHandle } from "node:fs/promises";

export const readRange = async (handle: FileHandle, offset: number, length: number) => {
  const buffer = new Uint8Array(length);
  const { bytesRead } = await handle.read(buffer, 0, length, offset);
  return buffer.subarray(0, bytesRead);
};
