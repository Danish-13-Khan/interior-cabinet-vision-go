const pairs = new Map<number, [number, number]>();

/** Stable [size, size] so R3F does not rebuild shadow maps every parent render. */
export function shadowMapSizePair(size: number): [number, number] {
  const cached = pairs.get(size);
  if (cached) return cached;
  const pair: [number, number] = [size, size];
  pairs.set(size, pair);
  return pair;
}
