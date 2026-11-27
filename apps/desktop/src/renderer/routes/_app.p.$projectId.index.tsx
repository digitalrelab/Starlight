import { DirectoryMissing, type Entry, type EntryRef, entryKey } from "@starlight/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, type ErrorComponentProps, Navigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { DirectoryBreadcrumbs } from "#renderer/features/browser/directory-breadcrumbs.tsx";
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
import { hiddenFiles } from "#renderer/features/settings/files.ts";
import { PageError } from "#renderer/features/shell/page-error.tsx";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";
import { FileViewer } from "#renderer/features/viewer/file-viewer.tsx";
import { AddMountButton } from "#renderer/features/projects/add-mount-button.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { useStored } from "#renderer/lib/storage.ts";

export const Route = createFileRoute("/_app/p/$projectId/")({
  validateSearch: parseDirectorySearch,
  loaderDeps: ({ search }) => ({ directory: toDirectory(search) }),
  loader: ({ context, params, deps }) => {
    const { queryClient, queries } = context;
    return Promise.all([
      queryClient.ensureQueryData(queries.entries(params.projectId, deps.directory)),
      layouts[layoutPreference(params.projectId).get()].preload?.(context, params.projectId, deps.directory),
    ]);
  },
  component: Browser,
  errorComponent: BrowserError,
});

function Browser() {
  const { projectId } = Route.useParams();
  const { directory } = Route.useLoaderDeps();
  const file = toFile(Route.useSearch());
  const navigate = Route.useNavigate();
  const router = useRouter();
  const { queries, subscriptions } = useStarlight();
  const { data: project } = useSuspenseQuery(queries.project(projectId));
  const { data: listing, error, isFetching } = useSuspenseQuery(queries.entries(projectId, directory));
  const preference = layoutPreference(projectId);
  const layout = useStored(preference);
  const showHidden = useStored(hiddenFiles) === "show";
  const entries = showHidden ? listing.entries : listing.entries.filter((entry) => !entry.hidden);
  useEffect(() => subscriptions.entries(projectId), [subscriptions, projectId]);

  const directoryKey = directory ? entryKey(directory) : "";

  const showFile = (shown: EntryRef) => {
    if (directory) void navigate({ search: toFileSearch(directory, shown), replace: true, state: true });
  };
  const onOpen = (entry: Entry) => {
    if (entry.kind === "directory") void navigate({ search: toDirectorySearch(entry.ref) });
    else if (entry.kind === "file" && directory)
      void navigate({ search: toFileSearch(directory, entry.ref), state: { fromDirectory: true } });
  };
  const preloadFolder = (folder: EntryRef) =>
    router.preloadRoute({
      to: "/p/$projectId",
      params: { projectId },
      search: toDirectorySearch(folder),
    });
  const prefetch = (entry: Entry) => {
    if (entry.kind === "directory") void preloadFolder(entry.ref);
  };
  useFoldersAhead(projectId, entries, preloadFolder);
  const closeViewer = () => {
    if (router.history.location.state.fromDirectory) router.history.back();
    else void navigate({ search: toDirectorySearch(directory), replace: true });
  };

  if (error && !isFetching) throw error;

  return (
    <>
      <PageHeader
        actions={
          <>
            <AddMountButton projectId={projectId} />
            <LayoutSwitcher value={layout} onChange={preference.set} />
          </>
        }
      >
        <DirectoryBreadcrumbs project={project} trail={listing.trail} />
      </PageHeader>
      <DirectoryView
        key={directoryKey}
        projectId={projectId}
        directory={directory}
        entries={entries}
        layout={layout}
        shown={file}
        onOpen={onOpen}
        onIntent={prefetch}
      />
      {directory && file ? (
        <FileViewer
          projectId={projectId}
          directory={directory}
          directoryName={listing.trail.at(-1)?.name ?? project.name}
          entries={entries}
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
