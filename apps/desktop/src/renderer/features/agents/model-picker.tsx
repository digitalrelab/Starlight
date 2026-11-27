import { ArrowDown01Icon, Search01Icon, Tick02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { AgentProvider, ModelChoice } from "@starlight/client";
import { cn, Icon, Popover, PopoverContent, PopoverTrigger } from "@starlight/ui";
import { type ReactNode, useState } from "react";
import { providerAppearance } from "./provider-appearance.ts";

interface Props {
  readonly providers: ReadonlyArray<AgentProvider>;
  readonly choice: ModelChoice;
  readonly onChoose: (choice: ModelChoice) => void;
}

const Option = ({
  selected,
  onClick,
  children,
}: {
  readonly selected: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1 text-left text-subtle focus-ring highlighted:bg-neutral-subtle-hovered highlighted:text-default aria-pressed:text-default"
  >
    {children}
    {selected ? <Icon icon={Tick02Icon} size={14} className="ml-auto shrink-0" /> : null}
  </button>
);

export const ModelPicker = ({ providers, choice, onChoose }: Props) => {
  const [open, setOpen] = useState(false);
  const [browsing, setBrowsing] = useState(choice.provider);
  const [search, setSearch] = useState("");
  const provider = providers.find(({ id }) => id === choice.provider);
  const model = provider?.models.find(({ id }) => id === choice.model);
  if (!provider || !model) return null;

  const shown = providers.find(({ id }) => id === browsing) ?? provider;
  const query = search.trim().toLowerCase();
  const models = shown.models.filter(({ name }) => name.toLowerCase().includes(query));
  const effort = model.efforts.find(({ id }) => id === choice.effort);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setBrowsing(choice.provider);
          setSearch("");
        }
      }}
    >
      <PopoverTrigger className="inline-flex h-control items-center gap-1.5 rounded-full px-2.5 text-sm text-subtle focus-ring highlighted:bg-neutral-subtle-hovered highlighted:text-default">
        <Icon icon={providerAppearance(provider.id).icon} size={14} />
        <span>{model.name}</span>
        {effort ? <span className="text-subtlest">{effort.label}</span> : null}
        <Icon icon={ArrowDown01Icon} size={14} className="text-subtlest" />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        aria-label="Model"
        className="h-[min(24rem,var(--available-height))] w-[min(36rem,var(--available-width))] flex-row p-0"
      >
        {providers.length > 1 ? (
          <div className="flex flex-col gap-1 border-r border-default p-2">
            {providers.map(({ id, name }) => (
              <button
                key={id}
                type="button"
                aria-label={name}
                aria-pressed={id === shown.id}
                onClick={() => setBrowsing(id)}
                className="inline-flex size-control items-center justify-center rounded-md text-subtle focus-ring highlighted:bg-neutral-subtle-hovered aria-pressed:bg-selected aria-pressed:text-selected"
              >
                <Icon icon={providerAppearance(id).icon} />
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col border-r border-default">
          <label className="flex items-center gap-2 border-b border-default px-3 py-2.5 text-subtlest">
            <Icon icon={Search01Icon} size={14} />
            <input
              value={search}
              autoFocus
              placeholder="Search models…"
              aria-label="Search models"
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-default outline-none placeholder:text-subtlest"
            />
          </label>
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-1.5">
            {models.map((candidate) => (
              <Option
                key={candidate.id}
                selected={shown.id === provider.id && candidate.id === model.id}
                onClick={() =>
                  onChoose({
                    provider: shown.id,
                    model: candidate.id,
                    effort: candidate.efforts.some(({ id }) => id === choice.effort) ? choice.effort : null,
                  })
                }
              >
                <span className="truncate">{candidate.name}</span>
              </Option>
            ))}
            {models.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-subtlest">No models found</p>
            ) : null}
          </div>
        </div>
        <div className={cn("flex w-44 shrink-0 flex-col", model.efforts.length === 0 && "hidden")}>
          <div className="flex items-baseline justify-between gap-2 border-b border-default px-3 py-2.5">
            <span className="text-subtle">Reasoning</span>
            <span className="truncate text-sm text-subtlest">{model.name}</span>
          </div>
          <div className="flex flex-col gap-0.5 p-1.5">
            <Option selected={choice.effort === null} onClick={() => onChoose({ ...choice, effort: null })}>
              Default
            </Option>
            {model.efforts.map(({ id, label }) => (
              <Option
                key={id}
                selected={choice.effort === id}
                onClick={() => onChoose({ ...choice, effort: id })}
              >
                {label}
              </Option>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
