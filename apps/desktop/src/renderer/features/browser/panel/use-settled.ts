import { useEffect, useState } from "react";

const SETTLE_MS = 120;

export const useSettled = (defers: boolean) => {
  const [settled, setSettled] = useState(!defers);
  useEffect(() => {
    if (settled) return;
    const timer = setTimeout(() => setSettled(true), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [settled]);
  return settled;
};
