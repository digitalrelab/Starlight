import { cn } from "cn";
import type { ColorScheme } from "./interface.tsx";

const schemes: Record<ColorScheme, string> = {
  system: "scheme-light-dark",
  light: "scheme-light",
  dark: "scheme-dark",
};

export const ColorSchemeSwatch = ({ scheme }: { readonly scheme: ColorScheme }) => (
  <span
    className={cn(
      "mr-2 inline-flex h-5 items-center gap-1 rounded-md border border-default bg-surface-raised px-1.5 text-xs font-medium text-default",
      schemes[scheme],
    )}
  >
    <span className="size-1.5 rounded-full bg-brand-bold" />
    Aa
  </span>
);
