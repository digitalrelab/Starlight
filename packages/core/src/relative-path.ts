export const joinRelative = (parent: string, name: string) => (parent === "" ? name : `${parent}/${name}`);
