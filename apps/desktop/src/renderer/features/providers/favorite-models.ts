import { anyString, defineStored, useStored } from "#renderer/lib/storage.ts";

export interface ModelKey {
  readonly provider: string;
  readonly model: string;
}

const favoriteModels = defineStored("agent.favorite-models", anyString, "[]");

const isModelKey = (value: unknown): value is ModelKey =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as ModelKey).provider === "string" &&
  typeof (value as ModelKey).model === "string";

const parse = (raw: string): ReadonlyArray<ModelKey> => {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isModelKey) : [];
  } catch {
    return [];
  }
};

const same = (a: ModelKey, b: ModelKey) => a.provider === b.provider && a.model === b.model;

export const useFavoriteModels = () => {
  const favorites = parse(useStored(favoriteModels));
  const isFavorite = (key: ModelKey) => favorites.some((favorite) => same(favorite, key));
  return {
    favorites,
    isFavorite,
    toggle: (key: ModelKey) =>
      favoriteModels.set(
        JSON.stringify(
          isFavorite(key) ? favorites.filter((favorite) => !same(favorite, key)) : [...favorites, key],
        ),
      ),
  };
};
