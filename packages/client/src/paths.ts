export const parentOf = (path: string) => path.slice(0, Math.max(0, path.lastIndexOf("/")));
