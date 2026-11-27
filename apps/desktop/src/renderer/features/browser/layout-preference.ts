import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_LAYOUT, isLayoutId, type LayoutId } from "./layouts/registry.ts";

const listeners = new Set<() => void>();

const storageKey = (workspaceId: string) => `starlight.layout.${workspaceId}`;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const readLayout = (workspaceId: string): LayoutId => {
  try {
    const stored = localStorage.getItem(storageKey(workspaceId));
    return isLayoutId(stored) ? stored : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
};

const writeLayout = (workspaceId: string, layout: LayoutId) => {
  try {
    localStorage.setItem(storageKey(workspaceId), layout);
  } catch {}
  for (const listener of listeners) listener();
};

export const useLayoutPreference = (workspaceId: string) => {
  const layout = useSyncExternalStore(subscribe, () => readLayout(workspaceId));
  const setLayout = useCallback((next: LayoutId) => writeLayout(workspaceId, next), [workspaceId]);
  return [layout, setLayout] as const;
};
