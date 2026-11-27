import { ChartLineData01Icon, DashboardSpeed02Icon, RefreshCwIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { AgentUsage } from "@starlight/client";
import { cn, IconButton, SegmentedControl, SegmentedControlItem } from "@starlight/ui";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "#renderer/features/settings/settings-page.tsx";
import { ProviderHistory } from "#renderer/features/usage/provider-history.tsx";
import { ProviderUsage } from "#renderer/features/usage/provider-usage.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { useNow } from "#renderer/lib/use-now.ts";

const TICK_MS = 60 * 1000;

const FAILED: AgentUsage = { _tag: "Unavailable", message: "Couldn't check usage." };

type View = "now" | "history";

export const Route = createFileRoute("/settings/usage")({
  validateSearch: (search): { view?: "history" } => (search["view"] === "history" ? { view: "history" } : {}),
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.agentProviders()),
  component: Usage,
});

function Usage() {
  const { queries } = useStarlight();
  const view: View = Route.useSearch().view ?? "now";
  const navigate = Route.useNavigate();
  const { data: providers } = useSuspenseQuery(queries.agentProviders());
  const { data: usage, refetch, isFetching, isError } = useQuery(queries.agentUsage());
  const { data: history } = useQuery({ ...queries.usageHistory(), enabled: view === "history" });
  const now = useNow(TICK_MS);

  return (
    <SettingsPage
      title="Usage"
      actions={
        <>
          <SegmentedControl<View>
            value={view}
            onValueChange={(next) =>
              void navigate({ search: next === "history" ? { view: next } : {}, replace: true })
            }
            aria-label="View"
          >
            <SegmentedControlItem value="now" icon={DashboardSpeed02Icon} label="Now" />
            <SegmentedControlItem value="history" icon={ChartLineData01Icon} label="History" />
          </SegmentedControl>
          <IconButton
            icon={RefreshCwIcon}
            label="Refresh"
            disabled={isFetching}
            className={cn(isFetching && "*:animate-spin")}
            onClick={() => void refetch()}
          />
        </>
      }
    >
      {providers.map((provider) =>
        view === "history" ? (
          <ProviderHistory key={provider.id} provider={provider} history={history} now={now} />
        ) : (
          <ProviderUsage
            key={provider.id}
            provider={provider}
            usage={
              usage?.find((entry) => entry.provider === provider.id)?.usage ?? (isError ? FAILED : undefined)
            }
            now={now}
          />
        ),
      )}
    </SettingsPage>
  );
}
