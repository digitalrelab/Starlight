import { defineStore, type Store } from "./store.ts";

const PREFIX = "starlight.";

type Guard<Value extends string> = (raw: string) => raw is Value;

export const oneOf =
  <Value extends string>(values: readonly Value[]): Guard<Value> =>
  (raw): raw is Value =>
    (values as readonly string[]).includes(raw);

export const anyString: Guard<string> = (_raw): _raw is string => true;

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

export const defineStored = <Value extends string>(
  name: string,
  guard: Guard<Value>,
  fallback: Value,
): Store<Value> => {
  const key = PREFIX + name;
  const parse = (raw: string | null) => (raw !== null && guard(raw) ? raw : fallback);
  const store = defineStore(parse(read(key)));

  window.addEventListener("storage", (event) => {
    if (event.key === key) store.set(parse(event.newValue));
  });

  return {
    ...store,
    set: (next) => {
      write(key, next);
      store.set(next);
    },
  };
};

export const defineStoredFamily = <Value extends string>(
  nameOf: (id: string) => string,
  guard: Guard<Value>,
  fallback: Value,
) => {
  const members = new Map<string, Store<Value>>();
  return (id: string) => {
    const existing = members.get(id);
    if (existing) return existing;
    const member = defineStored(nameOf(id), guard, fallback);
    members.set(id, member);
    return member;
  };
};
