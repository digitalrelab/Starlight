export const joinRelative = (parent: string, name: string) => (parent === "" ? name : `${parent}/${name}`);

export const parentOf = (path: string) => path.slice(0, Math.max(0, path.lastIndexOf("/")));
