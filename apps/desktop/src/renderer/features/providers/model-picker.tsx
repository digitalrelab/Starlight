import { StarIcon as StarFilledIcon } from "@hugeicons-pro/core-solid-rounded";
import { ArrowDown01Icon, Search01Icon, StarIcon, Tick02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { AgentModel, AgentProvider, ModelChoice } from "@starlight/client";
import { cn, Icon, Kbd, Popover, PopoverContent, PopoverTrigger, ScrollArea } from "@starlight/ui";
import { type ReactNode, useEffect, useState } from "react";
import { useFavoriteModels } from "./favorite-models.ts";
import { providerAppearance } from "./provider-appearance.ts";

const FAVORITES = "favorites";
const SHORTCUT_SLOTS = 9;

interface Props {
  readonly providers: ReadonlyArray<AgentProvider>;
  readonly choice: ModelChoice;
  readonly onChoose: (choice: ModelChoice) => void;
}

interface Entry {
  readonly provider: AgentProvider;
  readonly model: AgentModel;
}

const Mark = ({ provider, size = 16 }: { readonly provider: string; readonly size?: number }) => {
  const { icon, color } = providerAppearance(provider);
  return <Icon icon={icon} size={size} className={cn("shrink-0", color)} />;
};

const Option = ({
  selected,
  onClick,
  trailing,
  className,
  children,
}: {
  readonly selected: boolean;
  readonly onClick: () => void;
  readonly trailing?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={cn(
      "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-subtle focus-ring highlighted:bg-neutral-subtle-hovered highlighted:text-default aria-pressed:text-default",
      className,
    )}
  >
    {children}
    <span className="ml-auto flex shrink-0 items-center gap-2">
      {trailing}
      {selected ? <Icon icon={Tick02Icon} size={14} /> : null}
    </span>
  </button>
);

const RailButton = ({
  label,
  pressed,
  onClick,
  children,
}: {
  readonly label: string;
  readonly pressed: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={pressed}
    onClick={onClick}
    className="inline-flex size-control items-center justify-center rounded-md focus-ring highlighted:bg-neutral-subtle-hovered aria-pressed:bg-selected"
  >
    {children}
  </button>
);

export const ModelPicker = ({ providers, choice, onChoose }: Props) => {
  const { favorites, isFavorite, toggle } = useFavoriteModels();
  const [browsing, setBrowsing] = useState<string>(choice.provider);
  const [search, setSearch] = useState("");

  const starred = favorites.flatMap((key): ReadonlyArray<Entry> => {
    const provider = providers.find(({ id }) => id === key.provider);
    const model = provider?.models.find(({ id }) => id === key.model);
    return provider && model ? [{ provider, model }] : [];
  });

  const pick = ({ provider, model }: Entry) =>
    onChoose({
      provider: provider.id,
      model: model.id,
      effort: model.efforts.some(({ id }) => id === choice.effort) ? choice.effort : null,
    });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const slot = Number(event.key);
      if (!event.metaKey || !Number.isInteger(slot) || slot < 1 || slot > SHORTCUT_SLOTS) return;
      const entry = starred[slot - 1];
      if (!entry) return;
      event.preventDefault();
      pick(entry);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const provider = providers.find(({ id }) => id === choice.provider);
  const model = provider?.models.find(({ id }) => id === choice.model);
  if (!provider || !model) return null;

  const shown = providers.find(({ id }) => id === browsing) ?? provider;
  const entries =
    browsing === FAVORITES
      ? starred
      : shown.models.map((candidate) => ({ provider: shown, model: candidate }));
  const query = search.trim().toLowerCase();
  const visible = entries.filter((entry) => entry.model.name.toLowerCase().includes(query));
  const effort = model.efforts.find(({ id }) => id === choice.effort);

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) return;
        setBrowsing(starred.length > 0 ? FAVORITES : choice.provider);
        setSearch("");
      }}
    >
      <PopoverTrigger className="inline-flex h-control items-center gap-1.5 rounded-full px-2.5 text-sm text-subtle focus-ring highlighted:bg-neutral-subtle-hovered highlighted:text-default">
        <Mark provider={provider.id} size={14} />
        <span>{model.name}</span>
        {effort ? <span className="text-subtlest">{effort.label}</span> : null}
        <Icon icon={ArrowDown01Icon} size={14} className="text-subtlest" />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        aria-label="Model"
        className="h-[min(24rem,var(--available-height))] w-[min(38rem,var(--available-width))] flex-row p-0"
      >
        <nav aria-label="Providers" className="flex flex-col gap-1 border-r border-default p-2">
          <RailButton
            label="Favorites"
            pressed={browsing === FAVORITES}
            onClick={() => setBrowsing(FAVORITES)}
          >
            <Icon icon={StarFilledIcon} size={18} className="text-default" />
          </RailButton>
          <div className="mx-1 my-1 border-t border-default" />
          {providers.map(({ id, name }) => (
            <RailButton
              key={id}
              label={name}
              pressed={id === shown.id && browsing !== FAVORITES}
              onClick={() => setBrowsing(id)}
            >
              <Mark provider={id} size={18} />
            </RailButton>
          ))}
        </nav>
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
          <ScrollArea className="flex-1" contentClassName="flex flex-col gap-0.5 p-1.5">
            {visible.map((entry) => {
              const key = { provider: entry.provider.id, model: entry.model.id };
              const favorite = isFavorite(key);
              const slot = starred.indexOf(entry) + 1;
              return (
                <div key={`${key.provider}/${key.model}`} className="group/model relative">
                  <Option
                    selected={entry.provider.id === provider.id && entry.model.id === model.id}
                    onClick={() => pick(entry)}
                    className="pr-9"
                    trailing={
                      browsing === FAVORITES && slot > 0 && slot <= SHORTCUT_SLOTS ? (
                        <Kbd shortcut={["Meta", String(slot)]} />
                      ) : null
                    }
                  >
                    <Mark provider={entry.provider.id} />
                    <span className="truncate">{entry.model.name}</span>
                  </Option>
                  <button
                    type="button"
                    aria-label={
                      favorite
                        ? `Remove ${entry.model.name} from favorites`
                        : `Add ${entry.model.name} to favorites`
                    }
                    aria-pressed={favorite}
                    onClick={() => toggle(key)}
                    className="absolute inset-y-0 right-1 my-auto inline-flex size-6 items-center justify-center rounded-md text-subtlest opacity-0 focus-ring group-hover/model:opacity-100 hover:text-default focus-visible:opacity-100 aria-pressed:text-default aria-pressed:opacity-100"
                  >
                    <Icon icon={favorite ? StarFilledIcon : StarIcon} size={14} />
                  </button>
                </div>
              );
            })}
            {visible.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-subtlest">
                {browsing === FAVORITES && query === "" ? "Star a model to keep it here." : "No models found"}
              </p>
            ) : null}
          </ScrollArea>
        </div>
        {model.efforts.length > 0 ? (
          <div className="flex w-44 shrink-0 flex-col">
            <div className="flex items-baseline justify-between gap-2 border-b border-default px-3 py-2.5">
              <span className="text-subtle">Reasoning</span>
              <span className="truncate text-sm text-subtlest">{model.name}</span>
            </div>
            <ScrollArea className="flex-1" contentClassName="flex flex-col gap-0.5 p-1.5">
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
            </ScrollArea>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};
