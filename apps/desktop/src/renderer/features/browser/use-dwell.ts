import { useEffect, useRef } from "react";

const INTENT_DWELL_MS = 100;

export const useDwell = <Value>(onDwell: (value: Value) => void) => {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (value: Value | undefined) => {
    clearTimeout(timer.current);
    if (value !== undefined) timer.current = setTimeout(() => onDwell(value), INTENT_DWELL_MS);
  };
};
