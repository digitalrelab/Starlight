import { StarIcon as StarFilledIcon } from "@hugeicons-pro/core-solid-rounded";
import { ArrowDown01Icon, Search01Icon, StarIcon, Tick02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { AgentEffort, AgentModel, AgentProvider, ModelChoice } from "@starlight/client";
import { cn, Icon, Kbd, Popover, PopoverContent, PopoverTrigger, ScrollArea } from "@starlight/ui";
import { type ReactNode, useEffect, useEffectEvent, useState } from "react";
import { type Favorite, useFavoriteModels } from "./favorite-models.ts";
import { providerAppearance } from "./provider-appearance.ts";

const FAVORITES = "favorites";
const SHORTCUT_SLOTS = 9;

interface Props {
  readonly providers: ReadonlyArray<AgentProvider>;
  readonly choice: ModelChoice;
  readonly onChoose: (choice: ModelChoice) => void;
}

interface Starred {
  readonly choice: ModelChoice;
  readonly provider: AgentProvider;
  readonly model: AgentModel;
  readonly effort: AgentEffort | null;
}

const Mark = ({ provider, size = 16 }: { readonly provider: string; readonly size?: number }) => {
  const { icon, color } = providerAppearance(provider);
  return <Icon icon={icon} size={size} className={cn("shrink-0", color)} />;
};

const Option = ({
  selected,
  onClick,
  trailing,
  children,
}: {
  readonly selected: boolean;
  readonly onClick: () => void;
  readonly trailing?: ReactNode;
  readonly children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-subtle focus-ring highlighted:bg-neutral-subtle-hovered highlighted:text-default aria-pressed:text-default"
  >
    {children}
    <span className="ml-auto flex shrink-0 items-center gap-2">
      {trailing}
      {selected ? <Icon icon={Tick02Icon} size={14} /> : null}
    </span>
  </button>
);

const Starrable = ({
  label,
  starred,
  onToggle,
  children,
}: {
  readonly label: string;
  readonly starred: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}) => (
  <div className="group/starrable relative [&>button:first-child]:pr-9">
    {children}
    <button
      type="button"
      aria-label={starred ? `Remove ${label} from favorites` : `Add ${label} to favorites`}
      aria-pressed={starred}
      onClick={onToggle}
      className="absolute inset-y-0 right-1 my-auto inline-flex size-6 items-center justify-center rounded-md text-subtlest opacity-0 focus-ring group-hover/starrable:opacity-100 hover:text-default focus-visible:opacity-100 aria-pressed:text-default aria-pressed:opacity-100"
    >
      <Icon icon={starred ? StarFilledIcon : StarIcon} size={14} />
    </button>
  </div>
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

const resolve = (providers: ReadonlyArray<AgentProvider>, key: Favorite): ReadonlyArray<Starred> => {
  const provider = providers.find(({ id }) => id === key.provider);
  const model = provider?.models.find(({ id }) => id === key.model);
  const effort = model?.efforts.find(({ id }) => id === key.effort) ?? null;
  return provider && model && (effort !== null || key.effort === null)
    ? [
        {
          choice: { provider: provider.id, model: model.id, effort: effort?.id ?? null },
          provider,
          model,
          effort,
        },
      ]
    : [];
};

const labelOf = ({ model, effort }: Pick<Starred, "model" | "effort">) =>
  effort ? `${model.name} ${effort.label}` : model.name;

export const ModelPicker = ({ providers, choice, onChoose }: Props) => {
  const { favorites, isFavorite, toggle } = useFavoriteModels();
  const [browsing, setBrowsing] = useState<string>(choice.provider);
  const [search, setSearch] = useState("");
  const starred = favorites.flatMap((key) => resolve(providers, key));

  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    const slot = Number(event.key);
    const favorite = event.metaKey && slot >= 1 && slot <= SHORTCUT_SLOTS ? starred[slot - 1] : undefined;
    if (!favorite) return;
    event.preventDefault();
    onChoose(favorite.choice);
  });

  useEffect(() => {
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const provider = providers.find(({ id }) => id === choice.provider);
  const model = provider?.models.find(({ id }) => id === choice.model);
  if (!provider || !model) return null;

  const effort = model.efforts.find(({ id }) => id === choice.effort) ?? null;
  const shown = providers.find(({ id }) => id === browsing) ?? provider;
  const query = search.trim().toLowerCase();
  const matches = ({ name }: AgentModel) => name.toLowerCase().includes(query);
  const chosen = (key: Favorite) =>
    key.provider === choice.provider && key.model === choice.model && key.effort === choice.effort;

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
          <div className="m-1 border-t border-default" />
          {providers.map(({ id, name }) => (
            <RailButton
              key={id}
              label={name}
              pressed={browsing !== FAVORITES && id === shown.id}
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
            {browsing === FAVORITES
              ? starred.map((favorite, index) =>
                  matches(favorite.model) ? (
                    <Starrable
                      key={JSON.stringify(favorite.choice)}
                      label={labelOf(favorite)}
                      starred
                      onToggle={() => toggle(favorite.choice)}
                    >
                      <Option
                        selected={chosen(favorite.choice)}
                        onClick={() => onChoose(favorite.choice)}
                        trailing={
                          index < SHORTCUT_SLOTS ? <Kbd shortcut={["Meta", String(index + 1)]} /> : null
                        }
                      >
                        <Mark provider={favorite.provider.id} />
                        <span className="truncate">{favorite.model.name}</span>
                        {favorite.effort ? (
                          <span className="shrink-0 text-subtlest">{favorite.effort.label}</span>
                        ) : null}
                      </Option>
                    </Starrable>
                  ) : null,
                )
              : shown.models.filter(matches).map((candidate) => (
                  <Option
                    key={candidate.id}
                    selected={shown.id === provider.id && candidate.id === model.id}
                    onClick={() =>
                      onChoose({
                        provider: shown.id,
                        model: candidate.id,
                        effort: candidate.efforts.some(({ id }) => id === choice.effort)
                          ? choice.effort
                          : null,
                      })
                    }
                  >
                    <Mark provider={shown.id} />
                    <span className="truncate">{candidate.name}</span>
                  </Option>
                ))}
            {browsing === FAVORITES && starred.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-subtlest">
                Star a reasoning level to keep that combo here.
              </p>
            ) : null}
          </ScrollArea>
        </div>
        <div className="flex w-48 shrink-0 flex-col">
          <div className="flex items-baseline justify-between gap-2 border-b border-default px-3 py-2.5">
            <span className="text-subtle">Reasoning</span>
            <span className="truncate text-sm text-subtlest">{model.name}</span>
          </div>
          <ScrollArea className="flex-1" contentClassName="flex flex-col gap-0.5 p-1.5">
            {[null, ...model.efforts].map((level) => {
              const key: ModelChoice = { provider: provider.id, model: model.id, effort: level?.id ?? null };
              return (
                <Starrable
                  key={key.effort ?? ""}
                  label={labelOf({ model, effort: level })}
                  starred={isFavorite(key)}
                  onToggle={() => toggle(key)}
                >
                  <Option selected={chosen(key)} onClick={() => onChoose(key)}>
                    {level?.label ?? "Default"}
                  </Option>
                </Starrable>
              );
            })}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
