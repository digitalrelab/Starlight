import { anyString, defineStored } from "#renderer/lib/storage.ts";
import { useStore } from "#renderer/lib/store.ts";

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

type ModelKey = Pick<Favorite, "provider" | "model">;

export const sameModel = (a: ModelKey, b: ModelKey) => a.provider === b.provider && a.model === b.model;

export const useFavoriteModels = () => {
  const favorites = parse(useStore(favoriteModels));
  const isFavorite = (key: ModelKey) => favorites.some((candidate) => sameModel(candidate, key));
  return {
    favorites,
    isFavorite,
    toggle: (favorite: Favorite, order: ReadonlyArray<Favorite> = []) => {
      const rank = (candidate: Favorite) => {
        const index = order.findIndex((known) => sameModel(known, candidate));
        return index === -1 ? order.length : index;
      };
      favoriteModels.set(
        JSON.stringify(
          isFavorite(favorite)
            ? favorites.filter((candidate) => !sameModel(candidate, favorite))
            : [...favorites, favorite].toSorted((a, b) => rank(a) - rank(b)),
        ),
      );
    },
  };
};
