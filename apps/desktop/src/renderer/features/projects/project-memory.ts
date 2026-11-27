import type { Project } from "@starlight/client";
import { linkOptions } from "@tanstack/react-router";
import { anyString, defineStored, defineStoredFamily } from "#renderer/lib/storage.ts";

const SEPARATOR = ",";

const locations = defineStoredFamily((projectId) => `project-location.${projectId}`, anyString, "");
const recent = defineStored("recent-projects", anyString, "");

const recentIds = () => recent.get().split(SEPARATOR).filter(Boolean);

const setRecent = (ids: ReadonlyArray<string>) => recent.set(ids.join(SEPARATOR));

export const projectDestination = (projectId: string) => {
  const href = locations(projectId).get();
  return { ...linkOptions({ to: "/p/$projectId", params: { projectId } }), ...(href ? { href } : {}) };
};

export const byRecentUse = (projects: ReadonlyArray<Project>) => {
  const ids = recentIds();
  const rank = (project: Project) => {
    const index = ids.indexOf(project.id);
    return index === -1 ? ids.length : index;
  };
  return projects.toSorted((a, b) => rank(a) - rank(b));
};

export const forgetProject = (projectId: string) => {
  setRecent(recentIds().filter((id) => id !== projectId));
  locations(projectId).set("");
};

export const rememberLocation = (projectId: string, href: string) => {
  locations(projectId).set(href);
  const ids = recentIds();
  if (ids[0] !== projectId) setRecent([projectId, ...ids.filter((id) => id !== projectId)]);
};
