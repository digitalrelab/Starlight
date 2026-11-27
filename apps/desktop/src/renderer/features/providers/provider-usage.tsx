import { InformationCircleIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { AgentProvider, AgentUsage } from "@starlight/client";
import { Badge, Icon, Item, Spinner } from "@starlight/ui";
import { providerAppearance } from "./provider-appearance.ts";
import { UsageWindowRow } from "./usage-window-row.tsx";

interface Props {
  readonly provider: AgentProvider;
  readonly usage: AgentUsage | undefined;
  readonly now: number;
}

const Message = ({
  children,
  pending = false,
}: {
  readonly children: string;
  readonly pending?: boolean;
}) => (
  <Item.Root>
    <Item.Description className="flex items-center gap-1.5">
      {pending ? <Spinner size={14} /> : <Icon icon={InformationCircleIcon} size={14} />}
      {children}
    </Item.Description>
  </Item.Root>
);

const Windows = ({ provider: { status }, usage, now }: Props) => {
  if (status._tag === "NotReady") return <Message>{status.message}</Message>;
  if (usage === undefined) return <Message pending>Checking usage…</Message>;
  if (usage._tag === "Unavailable") return <Message>{usage.message}</Message>;
  if (usage.windows.length === 0) return <Message>No usage limits reported.</Message>;
  return usage.windows.map((window) => <UsageWindowRow key={window.label} window={window} now={now} />);
};

export const ProviderUsage = (props: Props) => {
  const { provider, usage } = props;
  const appearance = providerAppearance(provider.id);
  const plan = provider.status._tag === "Ready" ? provider.status.plan : undefined;
  const credits = usage?._tag === "Metered" ? usage.resetCredits : undefined;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 px-4 font-medium text-subtle">
        <Icon icon={appearance.icon} className={appearance.color} />
        {provider.name}
        {plan ? <Badge>{plan}</Badge> : null}
        {credits ? (
          <span className="ml-auto text-sm font-normal text-subtlest tabular-nums">
            {credits === 1 ? "1 reset available" : `${credits} resets available`}
          </span>
        ) : null}
      </h2>
      <Item.List>
        <Windows {...props} />
      </Item.List>
    </section>
  );
};
