import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Workspace } from "@starlight/client";
import { cn, Icon } from "@starlight/ui";
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
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex min-w-0 items-center gap-0.5">
          {i > 0 ? <Icon icon={ArrowRight01Icon} size={12} className="shrink-0 text-subtle" /> : null}
          <Link
            to="/w/$workspaceId"
            params={{ workspaceId: workspace.id }}
            search={{ path: crumb.path }}
            className={cn(
              "truncate rounded-sm px-1.5 py-0.5 hover:bg-neutral-subtle-hovered",
              i === crumbs.length - 1 ? "font-medium" : "text-subtle",
            )}
          >
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  );
};
