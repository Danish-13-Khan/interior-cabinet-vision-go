import {
  getFootprintDimensions,
  type CabinetInstance,
} from "../cabinetDimensions";
import type { CabinetRun, RunFiller } from "../cabinetLibrary";
import {
  filterDimensionChain,
  type DimensionChain,
} from "../placementSnap";
import { collectRunDimensionChain } from "../placementSnap";

function uniqueSorted(values: number[]) {
  return Array.from(new Set(values.map((value) => Math.round(value)))).sort(
    (a, b) => a - b,
  );
}

function labelsBetween(positions: number[]) {
  const labels: string[] = [];
  for (let index = 0; index < positions.length - 1; index += 1) {
    labels.push(`${Math.round(positions[index + 1]! - positions[index]!)}`);
  }
  return labels;
}

/** Run chain that also includes filler edges for clearer gap callouts. */
export function collectRunDraftDimensionChain(
  run: CabinetRun,
  cabinets: CabinetInstance[],
  fillers: RunFiller[] = [],
): DimensionChain | null {
  const base = collectRunDimensionChain(run, cabinets);
  if (!base) return null;

  const edges = [...base.positions];
  for (const filler of fillers.filter((item) => item.runId === run.id)) {
    if (run.axis === "x") {
      edges.push(filler.position.x - filler.size.width / 2);
      edges.push(filler.position.x + filler.size.width / 2);
    } else {
      edges.push(filler.position.z - filler.size.depth / 2);
      edges.push(filler.position.z + filler.size.depth / 2);
    }
  }

  const positions = uniqueSorted(edges);
  if (positions.length < 2) return null;
  return { positions, labels: labelsBetween(positions) };
}

export function collectFilteredRunDraftChain(
  run: CabinetRun,
  cabinets: CabinetInstance[],
  fillers: RunFiller[],
  minSegmentMm: number,
): DimensionChain | null {
  const chain = collectRunDraftDimensionChain(run, cabinets, fillers);
  if (!chain) return null;
  return filterDimensionChain(chain, minSegmentMm);
}

export function runOverallLengthMm(
  run: CabinetRun,
  cabinets: CabinetInstance[],
): number {
  const members = run.cabinetIds
    .map((id) => cabinets.find((cabinet) => cabinet.id === id))
    .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet));
  if (members.length === 0) return 0;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const cabinet of members) {
    const fp = getFootprintDimensions(
      cabinet.config.dimensions,
      cabinet.placement.rotation,
    );
    if (run.axis === "x") {
      min = Math.min(min, cabinet.placement.x - fp.width / 2);
      max = Math.max(max, cabinet.placement.x + fp.width / 2);
    } else {
      min = Math.min(min, cabinet.placement.z - fp.depth / 2);
      max = Math.max(max, cabinet.placement.z + fp.depth / 2);
    }
  }
  return Math.max(0, max - min);
}
