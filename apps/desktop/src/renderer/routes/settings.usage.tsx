import { RefreshCwIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { AgentUsage } from "@starlight/client";
import { cn, IconButton } from "@starlight/ui";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ProviderUsage } from "#renderer/features/providers/provider-usage.tsx";
import { SettingsPage } from "#renderer/features/settings/settings-page.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { useNow } from "#renderer/lib/use-now.ts";

const TICK_MS = 60 * 1000;

const FAILED: AgentUsage = { _tag: "Unavailable", message: "Couldn't check usage." };

export const Route = createFileRoute("/settings/usage")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.agentProviders()),
  component: Usage,
});

function Usage() {
  const { queries } = useStarlight();
  const { data: providers } = useSuspenseQuery(queries.agentProviders());
  const { data: usage, refetch, isFetching, isError } = useQuery(queries.agentUsage());
  const now = useNow(TICK_MS);

  return (
    <SettingsPage
      title="Usage"
      actions={
        <IconButton
          icon={RefreshCwIcon}
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
          usage={
            usage?.find((entry) => entry.provider === provider.id)?.usage ?? (isError ? FAILED : undefined)
          }
          now={now}
        />
      ))}
    </SettingsPage>
  );
}
