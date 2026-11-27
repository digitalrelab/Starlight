import { Interface } from "@starlight/ui";
import type { ReactNode } from "react";
import { colorScheme, cursor } from "./appearance.ts";

export const AppearanceRoot = ({ children }: { readonly children: ReactNode }) => (
  <Interface.Root colorScheme={colorScheme.useValue()} pointerCursors={cursor.useValue() === "pointer"}>
    {children}
  </Interface.Root>
);
