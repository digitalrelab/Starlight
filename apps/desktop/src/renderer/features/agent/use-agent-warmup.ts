import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useStarlight } from "#renderer/lib/context.ts";

export const useAgentWarmup = () => {
  const { mutations } = useStarlight();
  const { mutate: prepare } = useMutation(mutations.prepareAgentProviders());
  useEffect(() => prepare(), [prepare]);
};
