import { anyString, defineStored, useStored } from "#renderer/lib/storage.ts";

export interface Favorite {
  readonly provider: string;
  readonly model: string;
  readonly effort: string | null;
}

const favoriteModels = defineStored("agent.favorite-models", anyString, "[]");

const toFavorite = (value: unknown): ReadonlyArray<Favorite> => {
  if (typeof value !== "object" || value === null) return [];
  const { provider, model, effort } = value as Record<string, unknown>;
  if (typeof provider !== "string" || typeof model !== "string") return [];
  return [{ provider, model, effort: typeof effort === "string" ? effort : null }];
};

const parse = (raw: string): ReadonlyArray<Favorite> => {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.flatMap(toFavorite) : [];
  } catch {
    return [];
  }
};

const same = (a: Favorite, b: Favorite) =>
  a.provider === b.provider && a.model === b.model && a.effort === b.effort;

export const useFavoriteModels = () => {
  const favorites = parse(useStored(favoriteModels));
  const isFavorite = (favorite: Favorite) => favorites.some((candidate) => same(candidate, favorite));
  return {
    favorites,
    isFavorite,
    toggle: (favorite: Favorite) =>
      favoriteModels.set(
        JSON.stringify(
          isFavorite(favorite)
            ? favorites.filter((candidate) => !same(candidate, favorite))
            : [...favorites, favorite],
        ),
      ),
  };
};
