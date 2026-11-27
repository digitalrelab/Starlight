import { useRef } from "react";
import { BLUEPRINTS } from "./blueprints.ts";

export const useNamingMenu = () => {
  const started = useRef(false);
  return {
    onOpenChange: (open: boolean) => {
      if (!open) return;
      started.current = false;
      for (const blueprint of BLUEPRINTS) blueprint.prepare?.();
    },
    finalFocus: () => !started.current,
    start: (begin: () => void) => () => {
      started.current = true;
      begin();
    },
  };
};
