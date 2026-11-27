import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, type ErrorComponentProps, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Breadcrumbs } from "../features/browser/breadcrumbs.tsx";
import { EntryList } from "../features/browser/entry-list.tsx";
import { PageHeader } from "../features/shell/page-header.tsx";
import { useStarlight } from "../lib/context.ts";

interface Search {
  readonly path: string;
}

export const Route = createFileRoute("/_app/w/$workspaceId")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    path: typeof search["path"] === "string" ? search["path"] : "",
  }),
  loaderDeps: ({ search }) => ({ path: search.path }),
  loader: ({ context: { queryClient, queries }, params, deps }) =>
    Promise.all([
      queryClient.ensureQueryData(queries.workspace(params.workspaceId)),
      queryClient.ensureQueryData(queries.entries(params.workspaceId, deps.path)),
    ]),
  component: Browser,
  errorComponent: BrowserError,
});

function Browser() {
  const { workspaceId } = Route.useParams();
  const { path } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { queries, subscriptions } = useStarlight();
  useEffect(() => subscriptions.entries(workspaceId), [subscriptions, workspaceId]);
  const { data: workspace } = useSuspenseQuery(queries.workspace(workspaceId));
  const { data: entries } = useSuspenseQuery(queries.entries(workspaceId, path));

  return (
    <>
      <PageHeader>
        <Breadcrumbs workspace={workspace} path={path} />
      </PageHeader>
      <EntryList
        key={path}
        entries={entries}
        onOpen={(entry) => {
          if (entry.kind === "directory") void navigate({ search: { path: entry.path } });
        }}
      />
    </>
  );
}

function BrowserError({ error }: ErrorComponentProps) {
  return (
    <>
      <PageHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="max-w-md text-center text-muted">
          {error instanceof Error ? error.message : String(error)}
        </p>
        <Link to="/" className="text-accent hover:underline">
          Back
        </Link>
      </div>
    </>
  );
}
