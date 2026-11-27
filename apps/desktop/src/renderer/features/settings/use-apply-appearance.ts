import { setColorScheme, setPointerCursors } from "@starlight/ui";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useStarlight } from "../../lib/context.ts";

export const useApplyAppearance = () => {
  const { queries, mutations } = useStarlight();
  const { data: settings } = useSuspenseQuery(queries.settings());
  const { mutate: setNativeTheme } = useMutation(mutations.setNativeTheme());

  useEffect(() => setPointerCursors(settings.pointerCursors), [settings.pointerCursors]);

  useEffect(() => {
    setColorScheme(settings.theme);
    setNativeTheme(settings.theme);
  }, [settings.theme, setNativeTheme]);
};
