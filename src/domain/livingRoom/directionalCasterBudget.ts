/** Cap project directional shadow maps (Phase C). Fills stay unmapped when capped. */

export function shouldProjectDirectionalCast(
  wantsCast: boolean,
  alreadyCasting: number,
  maxDirectionalCasters?: number,
): boolean {
  if (!wantsCast) return false;
  if (maxDirectionalCasters === undefined) return true;
  return alreadyCasting < maxDirectionalCasters;
}

/** When Model View sets a directional budget, point/spot stay fill-only (no maps). */
export function shouldProjectFillCastShadow(
  maxDirectionalCasters?: number,
): boolean {
  return maxDirectionalCasters === undefined;
}
