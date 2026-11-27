export interface Store<Value> {
  readonly get: () => Value;
  readonly set: (value: Value) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

export const createStore = <Value>(initial: Value): Store<Value> => {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
