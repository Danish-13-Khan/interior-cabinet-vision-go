import type { DwgPlanBounds } from "./dwgUnits";

type Point = { x: number; y: number };

function aabb(points: readonly Point[]): DwgPlanBounds | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) return null;
  return { minX, minY, maxX, maxY };
}

function uniqueSorted(values: readonly number[]): number[] {
  const unique: number[] = [];
  for (const value of values) {
    if (!unique.length || value > unique[unique.length - 1]! + 1e-9) unique.push(value);
  }
  return unique;
}

function countBelow(sorted: readonly number[], value: number, inclusive = false) {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (sorted[mid]! < value || (inclusive && sorted[mid] === value)) low = mid + 1;
    else high = mid;
  }
  return low;
}

/** Keep the denser 1D run when a gap is much larger than typical unique spacing. */
export function gapClusterRange(values: readonly number[]): { min: number; max: number } | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const unique = uniqueSorted(sorted);
  let first = 0;
  let last = unique.length - 1;
  while (last > first) {
    const gaps = unique.slice(first + 1, last + 1).map((value, index) => value - unique[first + index]!);
    const typical = gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] ?? 0;
    const total = countBelow(sorted, unique[last]!, true) - countBelow(sorted, unique[first]!);
    let cut: { first: number; last: number; gap: number } | null = null;
    for (let index = first + 1; index <= last; index++) {
      const gap = unique[index]! - unique[index - 1]!;
      const leftCount = countBelow(sorted, unique[index]!) - countBelow(sorted, unique[first]!);
      const rightCount = total - leftCount;
      if (leftCount === rightCount) continue;
      const nextFirst = leftCount > rightCount ? first : index;
      const nextLast = leftCount > rightCount ? index - 1 : last;
      const coreSpan = unique[nextLast]! - unique[nextFirst]!;
      // Test every gap: several distant groups can make the biggest gap less
      // than 65% of the global span even when >99% of the drawing is compact.
      if (Math.max(leftCount, rightCount) / total < 2 / 3
        || gap <= Math.max(typical * 8, coreSpan * 4, 1e-6)) continue;
      if (!cut || gap > cut.gap) cut = { first: nextFirst, last: nextLast, gap };
    }
    if (!cut) break;
    first = cut.first;
    last = cut.last;
  }
  return { min: unique[first]!, max: unique[last]! };
}

/** Crop leftover CAD far from the main floor-plan cluster. */
export function clusterPlanBounds(points: readonly Point[]): DwgPlanBounds | null {
  const raw = aabb(points);
  const xRange = gapClusterRange(points.map((point) => point.x));
  const yRange = gapClusterRange(points.map((point) => point.y));
  if (!xRange || !yRange) return raw;
  const kept = points.filter((point) => (
    point.x >= xRange.min && point.x <= xRange.max && point.y >= yRange.min && point.y <= yRange.max
  ));
  return aabb(kept.length >= 2 ? kept : points) ?? raw;
}

export type EntityBox = DwgPlanBounds & { cx: number; cy: number };

export function entityBox(points: readonly Point[]): EntityBox | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

/** Crop leftover entities; keep each kept entity's full AABB (arcs stay intact). */
export function clusterEntityBounds(boxes: readonly EntityBox[]): DwgPlanBounds | null {
  if (!boxes.length) return null;
  const xRange = gapClusterRange(boxes.map((box) => box.cx));
  const yRange = gapClusterRange(boxes.map((box) => box.cy));
  const kept = (!xRange || !yRange) ? boxes : boxes.filter((box) => (
    box.cx >= xRange.min && box.cx <= xRange.max && box.cy >= yRange.min && box.cy <= yRange.max
  ));
  return aabb((kept.length ? kept : boxes).flatMap((box) => [
    { x: box.minX, y: box.minY }, { x: box.maxX, y: box.maxY },
  ]));
}
