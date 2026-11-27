import type { EntryRef } from "@starlight/client";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { useStarlight } from "#renderer/lib/context.ts";

export const useFolderAction = <T>(
  options: UseMutationOptions<T, Error, EntryRef>,
  onDone?: (result: T) => void,
) => {
  const { mutations } = useStarlight();
  const pick = useMutation(mutations.pickDirectory());
  const act = useMutation(options);

  return {
    run: () =>
      pick.mutate(undefined, {
        onSuccess: (root) => {
          if (root) act.mutate(root, onDone && { onSuccess: onDone });
        },
      }),
    pending: pick.isPending || act.isPending,
    error: pick.error ?? act.error,
  };
};
