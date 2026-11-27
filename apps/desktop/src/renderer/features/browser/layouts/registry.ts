import { GridViewIcon, ListViewIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { IconProps } from "@starlight/ui";
import type { ComponentType } from "react";
import type { RouterContext } from "../../../lib/context.ts";
import { GridLayout } from "./grid.tsx";
import { TableLayout } from "./table.tsx";
import type { LayoutProps } from "./types.ts";

export interface LayoutDefinition {
  readonly label: string;
  readonly icon: IconProps["icon"];
  readonly component: ComponentType<LayoutProps>;
  readonly preload?: (context: RouterContext, workspaceId: string, path: string) => Promise<unknown>;
}

const definitions = {
  table: { label: "Table", icon: ListViewIcon, component: TableLayout },
  grid: {
    label: "Grid",
    icon: GridViewIcon,
    component: GridLayout,
    preload: ({ queryClient, queries }, workspaceId, path) =>
      queryClient.ensureQueryData(queries.media(workspaceId, path)),
  },
} satisfies Record<string, LayoutDefinition>;

export type LayoutId = keyof typeof definitions;

export const layouts: Readonly<Record<LayoutId, LayoutDefinition>> = definitions;

export const DEFAULT_LAYOUT: LayoutId = "table";

export const layoutIds = Object.keys(layouts) as ReadonlyArray<LayoutId>;
