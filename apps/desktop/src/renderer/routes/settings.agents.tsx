import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ProviderRow } from "../features/agents/provider-row.tsx";
import { SettingsPage } from "../features/settings/settings-page.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/settings/agents")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.agentProviders()),
  component: Agents,
});

function Agents() {
  const { queries } = useStarlight();
  const { data: providers, isFetching, refetch } = useSuspenseQuery(queries.agentProviders());

  return (
    <SettingsPage title="Agents">
      {providers.map((provider) => (
        <ProviderRow
          key={provider.id}
          provider={provider}
          checking={isFetching}
          onCheck={() => void refetch()}
        />
      ))}
    </SettingsPage>
  );
}
