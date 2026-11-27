import { useSyncExternalStore } from "react";

export interface Store<Value> {
  readonly get: () => Value;
  readonly set: (next: Value) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

export const defineStore = <Value>(initial: Value): Store<Value> => {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (next) => {
      current = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export const useStore = <Value>({ subscribe, get }: Store<Value>) => useSyncExternalStore(subscribe, get);
