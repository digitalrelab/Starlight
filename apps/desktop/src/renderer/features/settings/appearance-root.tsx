import { Interface } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import { useStarlight } from "../../lib/context.ts";
import { colorScheme, cursor } from "./appearance.ts";

export const AppearanceRoot = ({ children }: { readonly children: ReactNode }) => {
  const { mutations } = useStarlight();
  const { mutate: setNativeColorScheme } = useMutation(mutations.setColorScheme());
  const scheme = colorScheme.useValue();

  useEffect(() => setNativeColorScheme(scheme), [scheme, setNativeColorScheme]);

  return (
    <Interface.Root colorScheme={scheme} pointerCursors={cursor.useValue() === "pointer"}>
      {children}
    </Interface.Root>
  );
};
