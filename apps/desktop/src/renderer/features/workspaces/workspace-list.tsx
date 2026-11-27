import { NavSection } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useStarlight } from "#renderer/lib/context.ts";
import { WorkspaceItem } from "./workspace-item.tsx";

export const WorkspaceList = () => {
  const { queries } = useStarlight();
  const { data: workspaces } = useSuspenseQuery(queries.workspaces());
  if (workspaces.length === 0) return null;

  return (
    <NavSection title="Workspaces">
      {workspaces.map((workspace) => (
        <WorkspaceItem key={workspace.id} workspace={workspace} />
      ))}
    </NavSection>
  );
};
