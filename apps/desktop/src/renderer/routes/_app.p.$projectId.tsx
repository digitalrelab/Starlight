import { createFileRoute } from "@tanstack/react-router";
import { PageError } from "#renderer/features/shell/page-error.tsx";

export const Route = createFileRoute("/_app/p/$projectId")({
  loader: ({ context: { queryClient, queries }, params }) =>
    queryClient.ensureQueryData(queries.project(params.projectId)),
  errorComponent: PageError,
});
