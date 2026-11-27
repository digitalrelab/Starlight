import type { AgentProvider, AgentUsage } from "@starlight/client";
import { ProviderSection, UsageMessage } from "./provider-section.tsx";
import { UsageWindowRow } from "./window-row.tsx";

interface Props {
  readonly provider: AgentProvider;
  readonly usage: AgentUsage | undefined;
  readonly now: number;
}

const Windows = ({ provider: { status }, usage, now }: Props) => {
  if (status._tag === "NotReady") return <UsageMessage>{status.message}</UsageMessage>;
  if (usage === undefined) return <UsageMessage pending>Checking usage…</UsageMessage>;
  if (usage._tag === "Unavailable") return <UsageMessage>{usage.message}</UsageMessage>;
  if (usage.windows.length === 0) return <UsageMessage>No usage limits reported.</UsageMessage>;
  return usage.windows.map((window) => <UsageWindowRow key={window.label} window={window} now={now} />);
};

export const ProviderUsage = (props: Props) => {
  const credits = props.usage?._tag === "Metered" ? props.usage.resetCredits : undefined;
  return (
    <ProviderSection
      provider={props.provider}
      aside={credits ? (credits === 1 ? "1 reset available" : `${credits} resets available`) : null}
    >
      <Windows {...props} />
    </ProviderSection>
  );
};
