import { type ReactNode, useLayoutEffect } from "react";
import { TooltipProvider } from "./tooltip.tsx";

export const COLOR_SCHEMES = ["system", "light", "dark"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

interface RootProps {
  readonly colorScheme: ColorScheme;
  readonly pointerCursors: boolean;
  readonly children: ReactNode;
}

const Root = ({ colorScheme, pointerCursors, children }: RootProps) => {
  useLayoutEffect(() => {
    Object.assign(document.documentElement.dataset, {
      colorScheme,
      cursor: pointerCursors ? "pointer" : "default",
    });
  }, [colorScheme, pointerCursors]);

  return <TooltipProvider>{children}</TooltipProvider>;
};

export const Interface = { Root };
