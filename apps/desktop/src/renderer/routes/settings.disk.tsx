import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DiskBreakdown } from "../features/settings/disk-breakdown.tsx";
import { SettingsPage } from "../features/settings/settings-page.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/settings/disk")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.diskUsage()),
  component: Disk,
});

function Disk() {
  const { queries } = useStarlight();
  const { data: usage } = useSuspenseQuery(queries.diskUsage());
  return (
    <SettingsPage title="Disk">
      <DiskBreakdown usage={usage} />
    </SettingsPage>
  );
}
