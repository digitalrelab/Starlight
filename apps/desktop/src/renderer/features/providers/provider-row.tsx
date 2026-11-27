import { InformationCircleIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { AgentProvider } from "@starlight/client";
import { Badge, cn, Icon, Item, StatusPill } from "@starlight/ui";
import { providerAppearance } from "./provider-appearance.ts";

export const ProviderRow = ({ provider: { id, name, status } }: { readonly provider: AgentProvider }) => {
  const appearance = providerAppearance(id);

  return (
    <Item.Root>
      <Item.Main>
        <Item.Media className={cn("size-9 justify-center rounded-lg", appearance.tile)}>
          <Icon icon={appearance.icon} size={20} />
        </Item.Media>
        <Item.Content>
          <div className="flex items-center gap-2">
            <Item.Title>{name}</Item.Title>
            {status._tag === "Ready" ? (
              <StatusPill tone="success">Connected</StatusPill>
            ) : (
              <StatusPill tone="warning">Not set up</StatusPill>
            )}
          </div>
          {status._tag === "Ready" ? (
            <Item.Description className="flex min-w-0 items-center gap-2">
              {status.account ? <span className="truncate">{status.account}</span> : null}
              {status.plan ? <Badge>{status.plan}</Badge> : null}
              {status.version ? <span className="text-subtlest tabular-nums">v{status.version}</span> : null}
            </Item.Description>
          ) : (
            <Item.Description className="flex items-center gap-1.5">
              <Icon icon={InformationCircleIcon} size={14} />
              {status.message}
            </Item.Description>
          )}
        </Item.Content>
      </Item.Main>
    </Item.Root>
  );
};
