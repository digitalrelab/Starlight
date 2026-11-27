import { type Crumb, entryKey, type Project } from "@starlight/client";
import { Breadcrumbs } from "@starlight/ui";
import { Link } from "@tanstack/react-router";
import { toDirectorySearch } from "./directory-search.ts";

interface Props {
  readonly project: Project;
  readonly trail: ReadonlyArray<Crumb>;
}

export const DirectoryBreadcrumbs = ({ project, trail }: Props) => (
  <Breadcrumbs.Root>
    {[{ ref: null, name: project.name }, ...trail].map(({ ref, name }) => (
      <Breadcrumbs.Item
        key={ref ? entryKey(ref) : ""}
        render={
          <Link
            to="/p/$projectId"
            params={{ projectId: project.id }}
            search={toDirectorySearch(ref)}
            activeOptions={{ exact: true }}
          />
        }
      >
        {name}
      </Breadcrumbs.Item>
    ))}
  </Breadcrumbs.Root>
);
