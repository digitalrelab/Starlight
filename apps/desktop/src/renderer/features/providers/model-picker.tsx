import { StarIcon as StarFilledIcon } from "@hugeicons-pro/core-solid-rounded";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Search01Icon,
  StarIcon,
  Tick02Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import type { AgentEffort, AgentModel, AgentProvider, ModelChoice } from "@starlight/client";
import {
  cn,
  Icon,
  IconButton,
  Kbd,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from "@starlight/ui";
import { type ReactNode, useEffect, useEffectEvent, useState } from "react";
import { type Favorite, sameModel, useFavoriteModels } from "./favorite-models.ts";
import { providerAppearance } from "./provider-appearance.ts";

const FAVORITES = "favorites";
const SHORTCUT_SLOTS = 9;

interface Props {
  readonly providers: ReadonlyArray<AgentProvider>;
  readonly choice: ModelChoice;
  readonly onChoose: (choice: ModelChoice) => void;
}

interface Entry {
  readonly choice: ModelChoice;
  readonly provider: AgentProvider;
  readonly model: AgentModel;
  readonly effort: AgentEffort | null;
}

const Mark = ({ provider, size = 16 }: { readonly provider: string; readonly size?: number }) => {
  const { icon, color } = providerAppearance(provider);
  return <Icon icon={icon} size={size} className={cn("shrink-0", color)} />;
};

const Row = ({
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
  <div
    className={cn(
      "group/row flex h-8 shrink-0 items-center rounded-md text-subtle highlighted:bg-neutral-subtle-hovered highlighted:text-default has-[>button[aria-pressed=true]]:text-default",
      className,
    )}
  >
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left focus-ring"
    >
      <Icon icon={Tick02Icon} size={14} className={cn("shrink-0", !selected && "invisible")} />
      {children}
    </button>
    {trailing ? <span className="flex shrink-0 items-center gap-2 pr-2">{trailing}</span> : null}
  </div>
);

const Star = ({
  model,
  starred,
  onToggle,
}: {
  readonly model: string;
  readonly starred: boolean;
  readonly onToggle: () => void;
}) => (
  <IconButton
    icon={starred ? StarFilledIcon : StarIcon}
    label={starred ? "Remove from favorites" : "Add to favorites"}
    aria-label={starred ? `Remove ${model} from favorites` : `Add ${model} to favorites`}
    aria-pressed={starred}
    onClick={onToggle}
    className="size-6 rounded-md text-subtlest opacity-0 group-hover/row:opacity-100 highlighted:bg-neutral-hovered focus-visible:opacity-100 aria-pressed:text-accent-yellow aria-pressed:opacity-100 aria-pressed:highlighted:text-accent-yellow"
  />
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

const entryOf = (provider: AgentProvider, model: AgentModel, effortId: string | null): Entry | undefined => {
  const effort = model.efforts.find(({ id }) => id === effortId) ?? null;
  if (effortId !== null && effort === null) return undefined;
  return { choice: { provider: provider.id, model: model.id, effort: effortId }, provider, model, effort };
};

export const ModelPicker = ({ providers, choice, onChoose }: Props) => {
  const { favorites, isFavorite, toggle } = useFavoriteModels();
  const [browsing, setBrowsing] = useState<string>(choice.provider);
  const [search, setSearch] = useState("");
  const [showLegacy, setShowLegacy] = useState(false);
  const [kept, setKept] = useState<ReadonlyArray<Favorite>>([]);

  const resolve = (list: ReadonlyArray<Favorite>) =>
    list.flatMap((favorite) => {
      const provider = providers.find(({ id }) => id === favorite.provider);
      const model = provider?.models.find(({ id }) => id === favorite.model);
      const entry = provider && model ? entryOf(provider, model, favorite.effort) : undefined;
      return entry ? [entry] : [];
    });

  const starred = resolve(favorites);
  const slotOf = (entry: Entry) => starred.findIndex(({ choice }) => sameModel(choice, entry.choice)) + 1;

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
  const listed = shown.models.filter(
    (candidate) => matches(candidate) && (query !== "" || showLegacy || !candidate.legacy),
  );
  const hasLegacy = query === "" && shown.models.some((candidate) => candidate.legacy);

  const favoritesShown = resolve([
    ...kept,
    ...favorites.filter((favorite) => !kept.some((known) => sameModel(known, favorite))),
  ]);

  const withCurrentEffort = (candidate: AgentModel) =>
    entryOf(shown, candidate, choice.effort) ?? entryOf(shown, candidate, null);

  const star = (entry: Entry | undefined) =>
    entry ? (
      <Star
        model={entry.model.name}
        starred={isFavorite(entry.choice)}
        onToggle={() => toggle(entry.choice, kept)}
      />
    ) : null;

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) return;
        setBrowsing(starred.length > 0 ? FAVORITES : choice.provider);
        setKept(favorites);
        setSearch("");
        setShowLegacy(false);
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
            <Icon icon={StarFilledIcon} size={18} className="text-accent-yellow" />
          </RailButton>
          <div className="m-1 border-t border-default" />
          {providers.map(({ id, name }) => (
            <RailButton
              key={id}
              label={name}
              pressed={browsing !== FAVORITES && id === shown.id}
              onClick={() => {
                setBrowsing(id);
                setShowLegacy(false);
              }}
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
            {browsing === FAVORITES ? (
              <>
                {favoritesShown.map((entry) => {
                  const slot = slotOf(entry);
                  return matches(entry.model) ? (
                    <Row
                      key={`${entry.choice.provider}/${entry.choice.model}`}
                      selected={
                        entry.choice.provider === choice.provider &&
                        entry.choice.model === choice.model &&
                        entry.choice.effort === choice.effort
                      }
                      onClick={() => onChoose(entry.choice)}
                      trailing={
                        <>
                          {star(entry)}
                          {slot > 0 && slot <= SHORTCUT_SLOTS ? (
                            <Kbd shortcut={["Meta", String(slot)]} />
                          ) : null}
                        </>
                      }
                    >
                      <Mark provider={entry.provider.id} />
                      <span className="truncate">{entry.model.name}</span>
                      {entry.effort ? (
                        <span className="shrink-0 text-subtlest">{entry.effort.label}</span>
                      ) : null}
                    </Row>
                  ) : null;
                })}
                {favoritesShown.length === 0 ? (
                  <p className="px-2 py-1.5 text-sm text-subtlest">
                    Star a model to keep it here with its reasoning level.
                  </p>
                ) : null}
              </>
            ) : (
              <>
                {listed.map((candidate) => {
                  const entry = withCurrentEffort(candidate);
                  return (
                    <Row
                      key={candidate.id}
                      selected={shown.id === provider.id && candidate.id === model.id}
                      onClick={() => entry && onChoose(entry.choice)}
                      trailing={star(entry)}
                      className={cn(candidate.legacy && "text-subtlest")}
                    >
                      <Mark provider={shown.id} />
                      <span className="truncate">{candidate.name}</span>
                    </Row>
                  );
                })}
                {hasLegacy ? (
                  <button
                    type="button"
                    aria-expanded={showLegacy}
                    onClick={() => setShowLegacy(!showLegacy)}
                    className="flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-sm text-subtlest focus-ring highlighted:bg-neutral-subtle-hovered highlighted:text-subtle"
                  >
                    <Icon
                      icon={ArrowRight01Icon}
                      size={14}
                      className={cn("transition-transform", showLegacy && "rotate-90")}
                    />
                    Older models
                  </button>
                ) : null}
                {listed.length === 0 && !hasLegacy ? (
                  <p className="px-2 py-1.5 text-sm text-subtlest">No models found</p>
                ) : null}
              </>
            )}
          </ScrollArea>
        </div>
        <div className="flex w-44 shrink-0 flex-col">
          <div className="flex items-baseline justify-between gap-2 border-b border-default px-3 py-2.5">
            <span className="text-subtle">Reasoning</span>
            <span className="truncate text-sm text-subtlest">{model.name}</span>
          </div>
          <ScrollArea className="flex-1" contentClassName="flex flex-col gap-0.5 p-1.5">
            {[null, ...model.efforts].map((level) => (
              <Row
                key={level?.id ?? ""}
                selected={choice.effort === (level?.id ?? null)}
                onClick={() => onChoose({ ...choice, effort: level?.id ?? null })}
              >
                {level?.label ?? "Default"}
              </Row>
            ))}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
