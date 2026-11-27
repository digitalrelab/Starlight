export const LIKE_ESCAPE = "\\";

const escaped = (text: string) => text.replace(/[\\%_]/g, `${LIKE_ESCAPE}$&`);

export const containing = (text: string) => `%${escaped(text)}%`;
