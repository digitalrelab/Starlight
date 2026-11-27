import { setPointerCursors } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useStarlight } from "../../lib/context.ts";

export const useApplyAppearance = () => {
  const { queries } = useStarlight();
  const { data: settings } = useSuspenseQuery(queries.settings());

  useEffect(() => setPointerCursors(settings.pointerCursors), [settings.pointerCursors]);
};
