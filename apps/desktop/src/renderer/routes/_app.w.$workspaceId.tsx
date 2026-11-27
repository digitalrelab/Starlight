import { type Entry, isMissingDirectory, parentOf } from "@starlight/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, type ErrorComponentProps, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { Breadcrumbs } from "../features/browser/breadcrumbs.tsx";
import { DirectoryView } from "../features/browser/directory-view.tsx";
import { layoutPreference } from "../features/browser/layout-preference.ts";
import { LayoutSwitcher } from "../features/browser/layout-switcher.tsx";
import { layouts } from "../features/browser/layouts/registry.ts";
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
  loader: ({ context, params, deps }) => {
    const { queryClient, queries } = context;
    return Promise.all([
      queryClient.ensureQueryData(queries.workspace(params.workspaceId)),
      queryClient.ensureQueryData(queries.entries(params.workspaceId, deps.path)),
      layouts[layoutPreference(params.workspaceId).get()].preload?.(context, params.workspaceId, deps.path),
    ]);
  },
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
  const { data: entries, error, isFetching } = useSuspenseQuery(queries.entries(workspaceId, path));
  const preference = layoutPreference(workspaceId);
  const layout = preference.useValue();

  const onOpen = useCallback(
    (entry: Entry) => {
      if (entry.kind === "directory") void navigate({ search: { path: entry.path } });
    },
    [navigate],
  );

  if (error && !isFetching) throw error;

  return (
    <>
      <PageHeader actions={<LayoutSwitcher value={layout} onChange={preference.set} />}>
        <Breadcrumbs workspace={workspace} path={path} />
      </PageHeader>
      <DirectoryView
        key={path}
        workspaceId={workspaceId}
        path={path}
        entries={entries}
        layout={layout}
        onOpen={onOpen}
      />
    </>
  );
}

function BrowserError({ error }: ErrorComponentProps) {
  const { path } = Route.useSearch();
  if (path !== "" && isMissingDirectory(error)) {
    return <Navigate from={Route.fullPath} search={{ path: parentOf(path) }} replace />;
  }
  return (
    <>
      <PageHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="max-w-md text-center text-subtle">
          {error instanceof Error ? error.message : String(error)}
        </p>
        <Link to="/" className="text-link hover:underline">
          Back
        </Link>
      </div>
    </>
  );
}
