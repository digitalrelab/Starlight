import { type Entry, isMissingDirectory, parentOf } from "@starlight/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, type ErrorComponentProps, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Breadcrumbs } from "../features/browser/breadcrumbs.tsx";
import { DirectoryView } from "../features/browser/directory-view.tsx";
import { readLayout, useLayoutPreference } from "../features/browser/layout-preference.ts";
import { LayoutSwitcher } from "../features/browser/layout-switcher.tsx";
import { layouts } from "../features/browser/layouts/registry.ts";
import { PageHeader } from "../features/shell/page-header.tsx";
import { FileViewer } from "../features/viewer/file-viewer.tsx";
import { useStarlight } from "../lib/context.ts";

interface Search {
  readonly path: string;
  readonly file?: string;
}

interface Selection {
  readonly folder: string;
  readonly path: string | undefined;
}

export const Route = createFileRoute("/_app/w/$workspaceId")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    path: typeof search["path"] === "string" ? search["path"] : "",
    ...(typeof search["file"] === "string" && { file: search["file"] }),
  }),
  loaderDeps: ({ search }) => ({ path: search.path }),
  loader: ({ context, params, deps }) => {
    const { queryClient, queries } = context;
    return Promise.all([
      queryClient.ensureQueryData(queries.workspace(params.workspaceId)),
      queryClient.ensureQueryData(queries.entries(params.workspaceId, deps.path)),
      layouts[readLayout(params.workspaceId)].preload?.(context, params.workspaceId, deps.path),
    ]);
  },
  component: Browser,
  errorComponent: BrowserError,
});

function Browser() {
  const { workspaceId } = Route.useParams();
  const { path, file } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { queries, subscriptions } = useStarlight();
  const [selection, setSelection] = useState<Selection>({ folder: path, path: undefined });
  useEffect(() => subscriptions.entries(workspaceId), [subscriptions, workspaceId]);
  const { data: workspace } = useSuspenseQuery(queries.workspace(workspaceId));
  const { data: entries, error, isFetching } = useSuspenseQuery(queries.entries(workspaceId, path));
  const [layout, setLayout] = useLayoutPreference(workspaceId);

  const selectedPath = file ?? (selection.folder === path ? selection.path : undefined);
  const select = useCallback(
    (selected: string | undefined) => setSelection({ folder: path, path: selected }),
    [path],
  );

  const onOpen = useCallback(
    (entry: Entry) => {
      if (entry.kind === "directory") void navigate({ search: { path: entry.path } });
      else if (entry.kind === "file") void navigate({ search: { path, file: entry.path } });
    },
    [navigate, path],
  );
  const showFile = useCallback(
    (shown: string) => void navigate({ search: { path, file: shown }, replace: true }),
    [navigate, path],
  );
  const closeViewer = useCallback(() => {
    select(file);
    void navigate({ search: { path }, replace: true });
  }, [select, navigate, path, file]);

  if (error && !isFetching) throw error;

  return (
    <>
      <PageHeader actions={<LayoutSwitcher value={layout} onChange={setLayout} />}>
        <Breadcrumbs workspace={workspace} path={path} />
      </PageHeader>
      <DirectoryView
        key={path}
        workspaceId={workspaceId}
        path={path}
        entries={entries}
        layout={layout}
        selectedPath={selectedPath}
        onSelectPath={select}
        onOpen={onOpen}
      />
      {file === undefined ? null : (
        <FileViewer
          workspaceId={workspaceId}
          folderName={path.slice(path.lastIndexOf("/") + 1) || workspace.name}
          entries={entries}
          file={file}
          onShow={showFile}
          onClose={closeViewer}
        />
      )}
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
