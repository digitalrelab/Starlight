import type { Crumb, EntryRef } from "@starlight/client";
import { useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { directoryKey } from "#renderer/features/browser/directory-search.ts";

export interface Place {
  readonly directory: EntryRef | null;
  readonly trail: ReadonlyArray<Crumb>;
}

export const usePlace = (
  current: Place,
  navigate: (directory: EntryRef | null) => void,
  onExternalArrival: (place: Place) => void,
) => {
  const [pending, setPending] = useState<Place>();
  const issued = useRef(new Set<string>());
  const arrived = useRef(directoryKey(current.directory));
  const at = pending ?? current;
  const currentKey = directoryKey(current.directory);

  const arrive = useEffectEvent((key: string) => {
    if (arrived.current === key) return;
    arrived.current = key;
    const isExternal = !pending || directoryKey(pending.directory) !== key;
    if (isExternal && issued.current.has(key)) return;
    setPending(undefined);
    issued.current.clear();
    if (isExternal) onExternalArrival(current);
  });
  useLayoutEffect(() => arrive(currentKey), [currentKey]);

  const go = (place: Place) => {
    const key = directoryKey(place.directory);
    if (key === directoryKey(at.directory)) return;
    issued.current.add(key);
    setPending(place);
    navigate(place.directory);
  };

  return { at, go };
};
