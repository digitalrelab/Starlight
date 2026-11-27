import {
  argbFromRgb,
  Cam16,
  hexFromArgb,
  QuantizerMap,
  QuantizerWu,
  Score,
} from "@material/material-color-utilities";
import type { Palette, PixelSample } from "@starlight/contracts";
import { forEachPixel, OPAQUE_ALPHA } from "./pixels.ts";

const MAX_CLUSTERS = 128;
const PALETTE_SIZE = 5;
const DISTINCT_DISTANCE = 11;

interface Candidate {
  readonly argb: number;
  readonly appearance: Cam16;
}

const candidateOf = (argb: number): Candidate => ({ argb, appearance: Cam16.fromInt(argb) });

const squaredDistance = (left: Cam16, right: Cam16) =>
  (left.jstar - right.jstar) ** 2 + (left.astar - right.astar) ** 2 + (left.bstar - right.bstar) ** 2;

const opaqueArgbs = (sample: PixelSample) => {
  const argbs: Array<number> = [];
  forEachPixel(sample, (red, green, blue, alpha) => {
    if (alpha >= OPAQUE_ALPHA) argbs.push(argbFromRgb(red, green, blue));
  });
  return argbs;
};

const nearestOf = (candidates: ReadonlyArray<Candidate>, argb: number) => {
  const appearance = Cam16.fromInt(argb);
  let nearest = candidates[0];
  let nearestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = squaredDistance(candidate.appearance, appearance);
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }
  return nearest;
};

const countsBy = (candidates: ReadonlyArray<Candidate>, counts: Iterable<readonly [number, number]>) => {
  const grouped = new Map<number, number>();
  for (const [argb, count] of counts) {
    const nearest = nearestOf(candidates, argb);
    if (nearest) grouped.set(nearest.argb, (grouped.get(nearest.argb) ?? 0) + count);
  }
  return grouped;
};

const clustersOf = (argbs: Array<number>) =>
  countsBy(new QuantizerWu().quantize(argbs, MAX_CLUSTERS).map(candidateOf), QuantizerMap.quantize(argbs));

export const paletteOf = (sample: PixelSample): Palette => {
  const argbs = opaqueArgbs(sample);
  if (argbs.length === 0) return [];
  const clusters = clustersOf(argbs);
  const ranked = [...clusters].sort(([, left], [, right]) => right - left).map(([argb]) => argb);
  const [dominant] = ranked;
  if (dominant === undefined) return [];
  const picked: Array<Candidate> = [];
  for (const argb of [
    dominant,
    ...Score.score(clusters, { desired: PALETTE_SIZE, fallbackColorARGB: dominant }),
    ...ranked,
  ]) {
    if (picked.length === PALETTE_SIZE) break;
    const candidate = candidateOf(argb);
    if (
      picked.every((pick) => squaredDistance(pick.appearance, candidate.appearance) >= DISTINCT_DISTANCE ** 2)
    )
      picked.push(candidate);
  }
  const coverage = countsBy(picked, clusters);
  return picked.map(({ argb }) => ({
    color: hexFromArgb(argb),
    share: (coverage.get(argb) ?? 0) / argbs.length,
  }));
};
