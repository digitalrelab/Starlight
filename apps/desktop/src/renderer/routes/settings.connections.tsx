import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ProviderRow } from "../features/agents/provider-row.tsx";
import { SettingsPage } from "../features/settings/settings-page.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/settings/connections")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.agentProviders()),
  component: Connections,
});

function Connections() {
  const { queries } = useStarlight();
  const { data: providers } = useSuspenseQuery(queries.agentProviders());

  return (
    <SettingsPage title="Connections">
      {providers.map((provider) => (
        <ProviderRow key={provider.id} provider={provider} />
      ))}
    </SettingsPage>
  );
}
