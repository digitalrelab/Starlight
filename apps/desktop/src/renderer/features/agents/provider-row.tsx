import { InformationCircleIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { AgentProvider } from "@starlight/client";
import { Badge, cn, Icon } from "@starlight/ui";
import { providerAppearance } from "./provider-appearance.ts";

const StatusPill = ({ ready }: { readonly ready: boolean }) => (
  <span
    className={cn(
      "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-xs",
      ready ? "bg-success text-success" : "bg-warning text-warning",
    )}
  >
    <span className="size-1.5 rounded-full bg-current" />
    {ready ? "Connected" : "Not set up"}
  </span>
);

export const ProviderRow = ({ provider: { id, name, status } }: { readonly provider: AgentProvider }) => {
  const appearance = providerAppearance(id);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", appearance.tile)}>
        <Icon icon={appearance.icon} size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          <StatusPill ready={status._tag === "Ready"} />
        </div>
        {status._tag === "Ready" ? (
          <div className="flex min-w-0 items-center gap-2 text-sm text-subtle">
            {status.account ? <span className="truncate">{status.account}</span> : null}
            {status.plan ? <Badge>{status.plan}</Badge> : null}
            {status.version ? <span className="text-subtlest tabular-nums">v{status.version}</span> : null}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-subtle">
            <Icon icon={InformationCircleIcon} size={14} />
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
};
