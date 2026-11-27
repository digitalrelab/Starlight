import type { AgentProvider } from "@starlight/client";
import { Button } from "@starlight/ui";
import { SettingRow } from "../settings/setting-row.tsx";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const describe = ({ status }: AgentProvider) =>
  status._tag === "Ready"
    ? [status.account, status.plan && capitalize(status.plan), status.version && `v${status.version}`]
        .filter(Boolean)
        .join(" · ")
    : status.message;

interface Props {
  readonly provider: AgentProvider;
  readonly checking: boolean;
  readonly onCheck: () => void;
}

export const ProviderRow = ({ provider, checking, onCheck }: Props) => (
  <SettingRow label={provider.name} description={describe(provider)}>
    {provider.status._tag === "Ready" ? (
      <span className="flex items-center gap-1.5 text-sm text-subtle">
        <span className="size-1.5 rounded-full bg-success-bold" />
        Connected
      </span>
    ) : (
      <Button intent="secondary" disabled={checking} onClick={onCheck}>
        Check again
      </Button>
    )}
  </SettingRow>
);
