const escaped = (text: string) => text.replace(/[\\%_]/g, "\\$&");

export const containing = (text: string) => `%${escaped(text)}%`;

export const startingWith = (text: string) => `${escaped(text)}%`;
