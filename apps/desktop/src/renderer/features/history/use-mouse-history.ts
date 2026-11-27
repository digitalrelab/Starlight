import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { HISTORY_DIRECTIONS, type HistoryDirection } from "#shared/history.ts";

const BUTTONS: Readonly<Record<number, HistoryDirection>> = { 3: "back", 4: "forward" };

export const useMouseHistory = () => {
  const { history } = useRouter();
  useEffect(() => {
    const onMouseUp = (event: MouseEvent) => {
      const direction = BUTTONS[event.button];
      if (direction) history.go(HISTORY_DIRECTIONS[direction].offset);
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [history]);
};
