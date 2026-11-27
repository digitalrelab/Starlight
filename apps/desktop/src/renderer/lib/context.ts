import type { Mutations, Queries, Subscriptions } from "@starlight/client";
import type { QueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

export interface RouterContext {
  readonly queries: Queries;
  readonly mutations: Mutations;
  readonly subscriptions: Subscriptions;
  readonly queryClient: QueryClient;
}

export const useStarlight = () => useRouteContext({ from: "__root__" });
