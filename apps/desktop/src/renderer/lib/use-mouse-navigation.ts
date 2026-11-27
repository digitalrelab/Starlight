import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

const BACK_BUTTON = 3;
const FORWARD_BUTTON = 4;

export const useMouseNavigation = () => {
  const { history } = useRouter();
  useEffect(() => {
    const onMouseUp = (event: MouseEvent) => {
      if (event.button === BACK_BUTTON) history.back();
      else if (event.button === FORWARD_BUTTON) history.forward();
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [history]);
};
