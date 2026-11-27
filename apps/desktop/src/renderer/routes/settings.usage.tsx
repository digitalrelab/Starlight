import { RefreshIcon } from "@hugeicons-pro/core-stroke-rounded";
import { cn, IconButton } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProviderUsage } from "#renderer/features/providers/provider-usage.tsx";
import { SettingsPage } from "#renderer/features/settings/settings-page.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

const TICK_MS = 60 * 1000;

export const Route = createFileRoute("/settings/usage")({
  loader: ({ context: { queryClient, queries } }) =>
    Promise.all([
      queryClient.ensureQueryData(queries.agentProviders()),
      queryClient.ensureQueryData(queries.agentUsage()),
    ]),
  component: Usage,
});

const useNow = () => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
};

function Usage() {
  const { queries } = useStarlight();
  const { data: providers } = useSuspenseQuery(queries.agentProviders());
  const { data: usage, refetch, isFetching, dataUpdatedAt } = useSuspenseQuery(queries.agentUsage());
  const now = Math.max(useNow(), dataUpdatedAt);

  return (
    <SettingsPage
      title="Usage"
      actions={
        <IconButton
          icon={RefreshIcon}
          label="Refresh"
          disabled={isFetching}
          className={cn(isFetching && "*:animate-spin")}
          onClick={() => void refetch()}
        />
      }
    >
      {providers.map((provider) => (
        <ProviderUsage
          key={provider.id}
          provider={provider}
          usage={usage.find((entry) => entry.provider === provider.id)?.usage}
          now={now}
        />
      ))}
      <p className="px-4 text-sm text-subtlest">
        The tick marks an even pace: where usage would be if it were spread evenly across the window.
      </p>
    </SettingsPage>
  );
}
