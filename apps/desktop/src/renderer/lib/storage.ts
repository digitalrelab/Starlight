import { useSyncExternalStore } from "react";

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

export const defineStored = <Value extends string>(name: string, guard: Guard<Value>, fallback: Value) => {
  const key = PREFIX + name;
  const parse = (raw: string | null) => (raw !== null && guard(raw) ? raw : fallback);
  const listeners = new Set<() => void>();
  let current = parse(read(key));

  const update = (next: Value) => {
    current = next;
    for (const listener of listeners) listener();
  };

  window.addEventListener("storage", (event) => {
    if (event.key === key) update(parse(event.newValue));
  });

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const get = () => current;

  return {
    get,
    set: (next: Value) => {
      write(key, next);
      update(next);
    },
    subscribe,
  };
};

type Stored<Value extends string> = ReturnType<typeof defineStored<Value>>;

export const useStored = <Value extends string>({ subscribe, get }: Stored<Value>) =>
  useSyncExternalStore(subscribe, get);

export const defineStoredFamily = <Value extends string>(
  nameOf: (id: string) => string,
  guard: Guard<Value>,
  fallback: Value,
) => {
  const members = new Map<string, Stored<Value>>();
  return (id: string) => {
    const existing = members.get(id);
    if (existing) return existing;
    const member = defineStored(nameOf(id), guard, fallback);
    members.set(id, member);
    return member;
  };
};
