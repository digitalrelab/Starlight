import { DirectoryMissing, type Entry, entryKey } from "@starlight/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, type ErrorComponentProps, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { Breadcrumbs } from "../features/browser/breadcrumbs.tsx";
import {
  parseDirectorySearch,
  toDirectory,
  toDirectorySearch,
} from "../features/browser/directory-search.ts";
import { DirectoryView } from "../features/browser/directory-view.tsx";
import { layoutPreference } from "../features/browser/layout-preference.ts";
import { LayoutSwitcher } from "../features/browser/layout-switcher.tsx";
import { layouts } from "../features/browser/layouts/registry.ts";
import { PageHeader } from "../features/shell/page-header.tsx";
import { AddMountButton } from "../features/workspaces/add-mount-button.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/_app/w/$workspaceId")({
  validateSearch: parseDirectorySearch,
  loaderDeps: ({ search }) => ({ directory: toDirectory(search) }),
  loader: ({ context, params, deps }) => {
    const { queryClient, queries } = context;
    return Promise.all([
      queryClient.ensureQueryData(queries.workspace(params.workspaceId)),
      queryClient.ensureQueryData(queries.entries(params.workspaceId, deps.directory)),
      layouts[layoutPreference(params.workspaceId).get()].preload?.(
        context,
        params.workspaceId,
        deps.directory,
      ),
    ]);
  },
  component: Browser,
  errorComponent: BrowserError,
});

function Browser() {
  const { workspaceId } = Route.useParams();
  const { directory } = Route.useLoaderDeps();
  const navigate = Route.useNavigate();
  const { queries, subscriptions } = useStarlight();
  const { data: workspace } = useSuspenseQuery(queries.workspace(workspaceId));
  const { data: listing, error, isFetching } = useSuspenseQuery(queries.entries(workspaceId, directory));
  const preference = layoutPreference(workspaceId);
  const layout = preference.useValue();
  useEffect(() => subscriptions.entries(workspaceId), [subscriptions, workspaceId, workspace.mounts]);

  const onOpen = useCallback(
    (entry: Entry) => {
      if (entry.kind === "directory") void navigate({ search: toDirectorySearch(entry.ref) });
    },
    [navigate],
  );

  if (error && !isFetching) throw error;

  return (
    <>
      <PageHeader
        actions={
          <>
            <AddMountButton workspaceId={workspaceId} />
            <LayoutSwitcher value={layout} onChange={preference.set} />
          </>
        }
      >
        <Breadcrumbs workspace={workspace} trail={listing.trail} />
      </PageHeader>
      <DirectoryView
        key={directory ? entryKey(directory) : ""}
        workspaceId={workspaceId}
        directory={directory}
        entries={listing.entries}
        layout={layout}
        onOpen={onOpen}
      />
    </>
  );
}

function BrowserError({ error }: ErrorComponentProps) {
  if (error instanceof DirectoryMissing) {
    return <Navigate from={Route.fullPath} search={toDirectorySearch(error.nearest)} replace />;
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
