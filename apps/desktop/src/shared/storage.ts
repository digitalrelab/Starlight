export type Parse<Value extends string> = (raw: string | null) => Value;

export const oneOf =
  <Value extends string>(values: readonly Value[], fallback: Value): Parse<Value> =>
  (raw) =>
    values.find((value) => value === raw) ?? fallback;

export const anyString =
  (fallback: string): Parse<string> =>
  (raw) =>
    raw ?? fallback;

export const storageKey = (name: string) => `starlight.${name}`;

export const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
