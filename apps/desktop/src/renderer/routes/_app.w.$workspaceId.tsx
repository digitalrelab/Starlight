import { createFileRoute } from "@tanstack/react-router";
import { PageError } from "#renderer/features/shell/page-error.tsx";

export const Route = createFileRoute("/_app/w/$workspaceId")({
  loader: ({ context: { queryClient, queries }, params }) =>
    queryClient.ensureQueryData(queries.workspace(params.workspaceId)),
  errorComponent: PageError,
});
