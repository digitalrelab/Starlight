import { InformationCircleIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { AgentProvider } from "@starlight/client";
import { Badge, Icon, Item, Spinner } from "@starlight/ui";
import type { ReactNode } from "react";
import { providerAppearance } from "#renderer/features/providers/provider-appearance.ts";

interface Props {
  readonly provider: AgentProvider;
  readonly aside?: ReactNode;
  readonly children: ReactNode;
}

export const ProviderSection = ({ provider, aside, children }: Props) => {
  const appearance = providerAppearance(provider.id);
  const plan = provider.status._tag === "Ready" ? provider.status.plan : undefined;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 px-4 font-medium text-subtle">
        <Icon icon={appearance.icon} className={appearance.color} />
        {provider.name}
        {plan ? <Badge>{plan}</Badge> : null}
        {aside ? (
          <span className="ml-auto text-sm font-normal text-subtlest tabular-nums">{aside}</span>
        ) : null}
      </h2>
      <Item.List>{children}</Item.List>
    </section>
  );
};

export const UsageMessage = ({
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
