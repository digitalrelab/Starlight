export interface Store<Value> {
  readonly get: () => Value;
  readonly subscribe: (listener: () => void) => () => void;
}

export const storeOf = <Value>(initial: Value) => {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: Value) => {
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
