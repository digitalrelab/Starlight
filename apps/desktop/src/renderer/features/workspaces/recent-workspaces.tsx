import { FolderIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Icon, NavItem } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useStarlight } from "../../lib/context.ts";

export const RecentWorkspaces = () => {
  const { queries } = useStarlight();
  const { data: workspaces } = useSuspenseQuery(queries.recentWorkspaces());
  if (workspaces.length === 0) return null;

  return (
    <section className="flex flex-col gap-px">
      <h2 className="flex h-7 items-center px-2 text-[11px] font-medium text-muted">Recent</h2>
      {workspaces.map((workspace) => (
        <NavItem
          key={workspace.id}
          title={workspace.rootPath}
          render={
            <Link
              to="/w/$workspaceId"
              params={{ workspaceId: workspace.id }}
              search={{ path: "" }}
              activeOptions={{ includeSearch: false }}
            />
          }
        >
          <Icon icon={FolderIcon} className="shrink-0" />
          <span className="truncate">{workspace.name}</span>
        </NavItem>
      ))}
    </section>
  );
};
