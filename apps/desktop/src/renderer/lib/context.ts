import type { Mutations, Queries, StarlightClient } from "@starlight/client";
import type { QueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

export interface RouterContext {
  readonly client: StarlightClient;
  readonly queries: Queries;
  readonly mutations: Mutations;
  readonly queryClient: QueryClient;
}

export const useStarlight = () => useRouteContext({ from: "__root__" });
