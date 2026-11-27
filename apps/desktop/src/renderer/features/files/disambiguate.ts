import type { EntryMatch } from "@starlight/client";

const trailOf = (match: EntryMatch, depth: number) => match.folders.slice(-depth).join(" / ");

export const disambiguate = (matches: ReadonlyArray<EntryMatch>) => {
  const depths = new Map(matches.map((match) => [match, 1]));
  const depthOf = (match: EntryMatch) => depths.get(match) ?? 1;
  let ambiguous = true;
  while (ambiguous) {
    ambiguous = false;
    const alike = Map.groupBy(
      matches,
      (match) => `${match.location.name}\0${trailOf(match, depthOf(match))}`,
    );
    for (const group of alike.values()) {
      if (group.length < 2) continue;
      for (const match of group) {
        if (depthOf(match) >= match.folders.length) continue;
        depths.set(match, depthOf(match) + 1);
        ambiguous = true;
      }
    }
  }
  return (match: EntryMatch) => trailOf(match, depthOf(match));
};
