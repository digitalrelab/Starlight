import { useSyncExternalStore } from "react";

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

export const definePreference = <Value extends string>(
  key: string,
  values: readonly Value[],
  fallback: Value,
) => {
  const parse = (raw: string | null) => values.find((value) => value === raw) ?? fallback;
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
    set: (next: Value) => {
      write(key, next);
      update(next);
    },
    useValue: () => useSyncExternalStore(subscribe, get),
  };
};
