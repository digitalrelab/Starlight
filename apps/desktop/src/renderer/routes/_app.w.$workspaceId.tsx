import { DirectoryMissing, type Entry, type EntryRef, entryKey } from "@starlight/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, type ErrorComponentProps, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Breadcrumbs } from "../features/browser/breadcrumbs.tsx";
import {
  parseDirectorySearch,
  toDirectory,
  toDirectorySearch,
  toFile,
  toFileSearch,
} from "../features/browser/directory-search.ts";
import { DirectoryView } from "../features/browser/directory-view.tsx";
import { layoutPreference } from "../features/browser/layout-preference.ts";
import { LayoutSwitcher } from "../features/browser/layout-switcher.tsx";
import { layouts } from "../features/browser/layouts/registry.ts";
import { PageHeader } from "../features/shell/page-header.tsx";
import { FileViewer } from "../features/viewer/file-viewer.tsx";
import { AddMountButton } from "../features/workspaces/add-mount-button.tsx";
import { useStarlight } from "../lib/context.ts";

interface Selection {
  readonly directory: string;
  readonly key: string | undefined;
}

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
  const file = toFile(Route.useSearch());
  const fileKey = file ? entryKey(file) : undefined;
  const navigate = Route.useNavigate();
  const { queries, subscriptions } = useStarlight();
  const { data: workspace } = useSuspenseQuery(queries.workspace(workspaceId));
  const { data: listing, error, isFetching } = useSuspenseQuery(queries.entries(workspaceId, directory));
  const preference = layoutPreference(workspaceId);
  const layout = preference.useValue();
  useEffect(() => subscriptions.entries(workspaceId), [subscriptions, workspaceId, workspace.mounts]);

  const directoryKey = directory ? entryKey(directory) : "";
  const [selection, setSelection] = useState<Selection>({ directory: directoryKey, key: undefined });
  const selectedKey = fileKey ?? (selection.directory === directoryKey ? selection.key : undefined);
  const select = useCallback(
    (key: string | undefined) => setSelection({ directory: directoryKey, key }),
    [directoryKey],
  );

  const onOpen = useCallback(
    (entry: Entry) => {
      if (entry.kind === "directory") void navigate({ search: toDirectorySearch(entry.ref) });
      else if (entry.kind === "file" && directory)
        void navigate({ search: toFileSearch(directory, entry.ref) });
    },
    [navigate, directory],
  );
  const showFile = useCallback(
    (shown: EntryRef) => {
      if (directory) void navigate({ search: toFileSearch(directory, shown), replace: true });
    },
    [navigate, directory],
  );
  const closeViewer = useCallback(() => {
    select(fileKey);
    void navigate({ search: toDirectorySearch(directory), replace: true });
  }, [select, navigate, directory, fileKey]);

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
        key={directoryKey}
        workspaceId={workspaceId}
        directory={directory}
        entries={listing.entries}
        layout={layout}
        selectedKey={selectedKey}
        onSelectKey={select}
        onOpen={onOpen}
      />
      {directory && file ? (
        <FileViewer
          workspaceId={workspaceId}
          directory={directory}
          directoryName={listing.trail.at(-1)?.name ?? workspace.name}
          entries={listing.entries}
          file={file}
          onShow={showFile}
          onClose={closeViewer}
        />
      ) : null}
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
