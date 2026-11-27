import { defineStore, type Store } from "./store.ts";

const PREFIX = "starlight.";

interface Codec<Value> {
  readonly decode: (raw: string) => Value | undefined;
  readonly encode: (value: Value) => string;
}

const verbatim = <Value extends string>(value: Value) => value;

export const oneOf = <Value extends string>(values: readonly Value[]): Codec<Value> => ({
  decode: (raw) => values.find((value) => value === raw),
  encode: verbatim,
});

export const anyString: Codec<string> = { decode: verbatim, encode: verbatim };

export const json = <Value>(decode: (value: unknown) => Value): Codec<Value> => ({
  decode: (raw) => {
    try {
      return decode(JSON.parse(raw));
    } catch {
      return undefined;
    }
  },
  encode: JSON.stringify,
});

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

export const defineStored = <Value>(name: string, codec: Codec<Value>, fallback: Value): Store<Value> => {
  const key = PREFIX + name;
  const parse = (raw: string | null) => (raw === null ? undefined : codec.decode(raw)) ?? fallback;
  const store = defineStore(parse(read(key)));

  window.addEventListener("storage", (event) => {
    if (event.key === key) store.set(parse(event.newValue));
  });

  return {
    ...store,
    set: (next) => {
      write(key, codec.encode(next));
      store.set(next);
    },
  };
};

export const defineStoredFamily = <Value>(
  nameOf: (id: string) => string,
  codec: Codec<Value>,
  fallback: Value,
) => {
  const members = new Map<string, Store<Value>>();
  return (id: string) => {
    const existing = members.get(id);
    if (existing) return existing;
    const member = defineStored(nameOf(id), codec, fallback);
    members.set(id, member);
    return member;
  };
};
