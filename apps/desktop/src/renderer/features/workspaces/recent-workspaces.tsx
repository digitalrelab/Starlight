import { FolderIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Icon } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useStarlight } from "../../lib/context.ts";

export const RecentWorkspaces = () => {
  const { queries } = useStarlight();
  const { data: workspaces } = useSuspenseQuery(queries.recentWorkspaces());
  if (workspaces.length === 0) return null;

  return (
    <section className="flex flex-col gap-1">
      <h2 className="px-2 text-[11px] font-medium tracking-wide text-muted uppercase">Recent</h2>
      <ul>
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <Link
              to="/w/$workspaceId"
              params={{ workspaceId: workspace.id }}
              search={{ path: "" }}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-hover"
            >
              <Icon icon={FolderIcon} className="shrink-0 text-accent" />
              <span className="font-medium">{workspace.name}</span>
              <span className="truncate text-muted">{workspace.rootPath}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
