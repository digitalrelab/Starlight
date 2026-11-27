import { NavSection } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useStarlight } from "#renderer/lib/context.ts";
import { ProjectItem } from "./project-item.tsx";

export const ProjectList = ({ activeProjectId }: { readonly activeProjectId: string | null }) => {
  const { queries } = useStarlight();
  const { data: projects } = useSuspenseQuery(queries.projects());
  if (projects.length === 0) return null;

  return (
    <NavSection title="Projects">
      {projects.map((project) => (
        <ProjectItem key={project.id} project={project} active={project.id === activeProjectId} />
      ))}
    </NavSection>
  );
};
