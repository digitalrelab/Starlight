import { DirectoryMissing, type Entry, type EntryRef, entryKey } from "@starlight/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, type ErrorComponentProps, Navigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Breadcrumbs } from "#renderer/features/browser/breadcrumbs.tsx";
import {
  parseDirectorySearch,
  toDirectory,
  toDirectorySearch,
  toFile,
  toFileSearch,
} from "#renderer/features/browser/directory-search.ts";
import { DirectoryView } from "#renderer/features/browser/directory-view.tsx";
import { layoutPreference } from "#renderer/features/browser/layout-preference.ts";
import { LayoutSwitcher } from "#renderer/features/browser/layout-switcher.tsx";
import { layouts } from "#renderer/features/browser/layouts/registry.ts";
import { useFoldersAhead } from "#renderer/features/browser/use-folders-ahead.ts";
import { PageError } from "#renderer/features/shell/page-error.tsx";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";
import { FileViewer } from "#renderer/features/viewer/file-viewer.tsx";
import { AddMountButton } from "#renderer/features/workspaces/add-mount-button.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { useStored } from "#renderer/lib/storage.ts";

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
  const router = useRouter();
  const { queries, subscriptions } = useStarlight();
  const { data: workspace } = useSuspenseQuery(queries.workspace(workspaceId));
  const { data: listing, error, isFetching } = useSuspenseQuery(queries.entries(workspaceId, directory));
  const preference = layoutPreference(workspaceId);
  const layout = useStored(preference);
  useEffect(() => subscriptions.entries(workspaceId), [subscriptions, workspaceId, workspace.mounts]);

  const directoryKey = directory ? entryKey(directory) : "";
  const [selection, setSelection] = useState<Selection>({ directory: directoryKey, key: undefined });
  const selectedKey = fileKey ?? (selection.directory === directoryKey ? selection.key : undefined);
  const select = (key: string | undefined) => setSelection({ directory: directoryKey, key });

  const showFile = (shown: EntryRef) => {
    if (directory) void navigate({ search: toFileSearch(directory, shown), replace: true });
  };
  const onOpen = (entry: Entry) => {
    if (entry.kind === "directory") void navigate({ search: toDirectorySearch(entry.ref) });
    else if (entry.kind === "file") showFile(entry.ref);
  };
  const preloadFolder = (folder: EntryRef) =>
    router.preloadRoute({ to: Route.fullPath, params: { workspaceId }, search: toDirectorySearch(folder) });
  const prefetch = (entry: Entry) => {
    if (entry.kind === "directory") void preloadFolder(entry.ref);
  };
  useFoldersAhead(workspaceId, listing.entries, preloadFolder);
  const closeViewer = () => {
    select(fileKey);
    void navigate({ search: toDirectorySearch(directory), replace: true });
  };

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
        onIntent={prefetch}
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
  return <PageError error={error} />;
}
