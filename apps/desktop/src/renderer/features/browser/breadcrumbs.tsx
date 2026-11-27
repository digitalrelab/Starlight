import type { Workspace } from "@starlight/client";
import { ChevronRightIcon, cn } from "@starlight/ui";
import { Link } from "@tanstack/react-router";

interface Props {
  readonly workspace: Workspace;
  readonly path: string;
}

export const Breadcrumbs = ({ workspace, path }: Props) => {
  const segments = path === "" ? [] : path.split("/");
  const crumbs = [
    { label: workspace.name, path: "" },
    ...segments.map((label, i) => ({ label, path: segments.slice(0, i + 1).join("/") })),
  ];

  return (
    <nav className="flex min-w-0 items-center gap-0.5">
      <Link to="/" className="rounded px-1.5 py-0.5 text-muted hover:bg-hover hover:text-fg">
        Starlight
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex min-w-0 items-center gap-0.5">
          <ChevronRightIcon className="size-3 shrink-0 text-muted" />
          <Link
            to="/w/$workspaceId"
            params={{ workspaceId: workspace.id }}
            search={{ path: crumb.path }}
            className={cn(
              "truncate rounded px-1.5 py-0.5 hover:bg-hover",
              i === crumbs.length - 1 ? "font-medium" : "text-muted",
            )}
          >
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  );
};
