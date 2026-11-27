import { FolderIcon } from "@hugeicons-pro/core-stroke-rounded";
import { cn, Icon } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useStarlight } from "../../lib/context.ts";
import { navItem } from "../shell/nav-item.ts";

export const WorkspaceNav = () => {
  const { queries } = useStarlight();
  const { data: workspaces } = useSuspenseQuery(queries.recentWorkspaces());
  if (workspaces.length === 0) return null;

  return (
    <section className="flex flex-col gap-px">
      <h2 className="flex h-7 items-center px-2 text-[11px] font-medium text-muted">Workspaces</h2>
      {workspaces.map((workspace) => (
        <Link
          key={workspace.id}
          to="/w/$workspaceId"
          params={{ workspaceId: workspace.id }}
          search={{ path: "" }}
          activeOptions={{ includeSearch: false }}
          title={workspace.rootPath}
          className={cn(navItem, "data-[status=active]:bg-selected data-[status=active]:text-fg")}
        >
          <Icon icon={FolderIcon} className="shrink-0" />
          <span className="truncate">{workspace.name}</span>
        </Link>
      ))}
    </section>
  );
};
