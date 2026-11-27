import type { AgentProvider, Chat, ModelChoice } from "@starlight/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useStarlight } from "#renderer/lib/context.ts";
import { defineStored, json } from "#renderer/lib/storage.ts";
import { useStore } from "#renderer/lib/store.ts";

interface Wanted {
  readonly provider?: string;
  readonly model?: string | null;
  readonly effort?: string | null;
}

const toWanted = (value: unknown): Wanted => (typeof value === "object" && value !== null ? value : {});

const lastChoice = defineStored("agent.model", json(toWanted), {});

const resolve = (providers: ReadonlyArray<AgentProvider>, wanted: Wanted): ModelChoice | null => {
  const preferred = providers.find((provider) => provider.id === wanted.provider);
  const provider = preferred ?? providers[0];
  if (!provider) return null;
  const model =
    (preferred && provider.models.find((candidate) => candidate.id === wanted.model)) ?? provider.models[0];
  if (!model) return null;
  const effort = model.efforts.find((candidate) => candidate.id === wanted.effort)?.id ?? null;
  return { provider: provider.id, model: model.id, effort };
};

export const useModelChoice = (chat?: Chat) => {
  const { queries } = useStarlight();
  const { data } = useSuspenseQuery(queries.agentProviders());
  const stored = useStore(lastChoice);
  const scope = chat?.id ?? "";
  const [picked, setPicked] = useState<{ readonly scope: string; readonly choice: ModelChoice } | null>(null);

  const providers = data.filter(
    (provider) =>
      provider.status._tag === "Ready" &&
      provider.models.length > 0 &&
      (chat === undefined || provider.id === chat.provider),
  );
  const wanted = picked?.scope === scope ? picked.choice : (chat ?? stored);

  return {
    providers,
    choice: resolve(providers, wanted),
    choose: (choice: ModelChoice) => {
      setPicked({ scope, choice });
      lastChoice.set(choice);
    },
  };
};
