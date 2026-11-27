import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { type Crumb, entryKey, type Workspace } from "@starlight/client";
import { cn, Icon } from "@starlight/ui";
import { Link } from "@tanstack/react-router";
import { toDirectorySearch } from "./directory-search.ts";

interface Props {
  readonly workspace: Workspace;
  readonly trail: ReadonlyArray<Crumb>;
}

export const Breadcrumbs = ({ workspace, trail }: Props) => {
  const crumbs = [
    { key: "", label: workspace.name, search: toDirectorySearch(null) },
    ...trail.map((crumb) => ({
      key: entryKey(crumb.ref),
      label: crumb.name,
      search: toDirectorySearch(crumb.ref),
    })),
  ];

  return (
    <nav className="flex min-w-0 items-center gap-0.5">
      {crumbs.map((crumb, i) => (
        <span key={crumb.key} className="flex min-w-0 items-center gap-0.5">
          {i > 0 ? <Icon icon={ArrowRight01Icon} size={12} className="text-subtle" /> : null}
          <Link
            to="/w/$workspaceId"
            params={{ workspaceId: workspace.id }}
            search={crumb.search}
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
