import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useStarlight } from "../../lib/context.ts";

export const useAppearance = () => {
  const { queries } = useStarlight();
  const { data: settings } = useSuspenseQuery(queries.settings());

  useEffect(() => {
    document.documentElement.toggleAttribute("data-pointer-cursors", settings.pointerCursors);
  }, [settings.pointerCursors]);
};
