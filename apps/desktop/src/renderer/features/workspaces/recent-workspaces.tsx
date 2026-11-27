import { FolderIcon } from "@hugeicons-pro/core-stroke-rounded";
import { NavItem, NavSection } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useStarlight } from "../../lib/context.ts";

export const RecentWorkspaces = () => {
  const { queries } = useStarlight();
  const { data: workspaces } = useSuspenseQuery(queries.recentWorkspaces());
  if (workspaces.length === 0) return null;

  return (
    <NavSection title="Recent">
      {workspaces.map((workspace) => (
        <NavItem
          key={workspace.id}
          icon={FolderIcon}
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
          {workspace.name}
        </NavItem>
      ))}
    </NavSection>
  );
};
