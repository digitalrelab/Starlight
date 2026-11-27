import { Item } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ProviderRow } from "../features/providers/provider-row.tsx";
import { SettingsPage } from "../features/settings/settings-page.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/settings/providers")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.agentProviders()),
  component: Providers,
});

function Providers() {
  const { queries } = useStarlight();
  const { data: providers } = useSuspenseQuery(queries.agentProviders());

  return (
    <SettingsPage title="Providers">
      <Item.List>
        {providers.map((provider) => (
          <ProviderRow key={provider.id} provider={provider} />
        ))}
      </Item.List>
    </SettingsPage>
  );
}
