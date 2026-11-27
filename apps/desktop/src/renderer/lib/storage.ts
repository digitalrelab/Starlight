import { useSyncExternalStore } from "react";
import { type Parse, readStorage, storageKey, writeStorage } from "#shared/storage.ts";

export const defineStored = <Value extends string>(name: string, parse: Parse<Value>) => {
  const key = storageKey(name);
  const listeners = new Set<() => void>();
  let current = parse(readStorage(key));

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
      writeStorage(key, next);
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
  parse: Parse<Value>,
) => {
  const members = new Map<string, Stored<Value>>();
  return (id: string) => {
    const existing = members.get(id);
    if (existing) return existing;
    const member = defineStored(nameOf(id), parse);
    members.set(id, member);
    return member;
  };
};
