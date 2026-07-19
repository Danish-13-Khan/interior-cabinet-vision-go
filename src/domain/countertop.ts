import type { CabinetInstance } from "./cabinetDimensions";

// ── Countertop / Worktop types ──────────────────────────────

export type Countertop = {
  id: string;
  label: string;
  cabinetIds: string[];
  widthMm: number;
  depthMm: number;
  thicknessMm: number;
  overhangFrontMm: number;
  overhangSidesMm: number;
  positionX: number;   // center X in mm
  positionY: number;   // top surface Y in mm (= cabinet height)
  positionZ: number;   // center Z in mm
};

export type CountertopConfig = {
  thicknessMm: number;
  overhangFrontMm: number;
  overhangSidesMm: number;
};

// ── Cabinets eligible for countertop ─────────────────────────

function isBaseCabinet(instance: CabinetInstance): boolean {
  return instance.placement.attachment === "floor" && instance.config.type === "base";
}

// ── Group base cabinets into runs (contiguous by X) ─────────

export function findBaseCabinetRuns(cabinets: CabinetInstance[]): CabinetInstance[][] {
  const baseCabs = cabinets.filter(isBaseCabinet).sort((a, b) => a.placement.x - b.placement.x);
  if (baseCabs.length === 0) return [];

  const runs: CabinetInstance[][] = [];
  let currentRun: CabinetInstance[] = [baseCabs[0]];

  for (let i = 1; i < baseCabs.length; i++) {
    const prev = baseCabs[i - 1];
    const curr = baseCabs[i];

    // Check if cabinets are adjacent (within 300mm gap)
    const prevRight = prev.placement.x + prev.config.dimensions.width / 2;
    const currLeft = curr.placement.x - curr.config.dimensions.width / 2;
    const gap = currLeft - prevRight;

    if (gap <= 300 && prev.placement.z === curr.placement.z) {
      currentRun.push(curr);
    } else {
      if (currentRun.length > 0) runs.push(currentRun);
      currentRun = [curr];
    }
  }
  if (currentRun.length > 0) runs.push(currentRun);

  return runs;
}

// ── Generate countertop for a run ────────────────────────────

export function generateCountertop(
  run: CabinetInstance[],
  config: CountertopConfig = DEFAULT_COUNTERTOP_CONFIG,
): Countertop {
  if (run.length === 0) throw new Error("Empty run");

  const sorted = [...run].sort((a, b) => a.placement.x - b.placement.x);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const startX = first.placement.x - first.config.dimensions.width / 2 - config.overhangSidesMm;
  const endX = last.placement.x + last.config.dimensions.width / 2 + config.overhangSidesMm;
  const widthMm = endX - startX;

  // Use the deepest cabinet as base depth
  const maxDepthMm = Math.max(...run.map((c) => c.config.dimensions.depth));

  return {
    id: `countertop-${Date.now()}`,
    label: `Countertop ${run.length}cab`,
    cabinetIds: run.map((c) => c.id),
    widthMm,
    depthMm: maxDepthMm + config.overhangFrontMm,
    thicknessMm: config.thicknessMm,
    overhangFrontMm: config.overhangFrontMm,
    overhangSidesMm: config.overhangSidesMm,
    positionX: startX + widthMm / 2,
    positionY: first.config.dimensions.height,
    positionZ: run[0].placement.z,
  };
}

// ── Default config ───────────────────────────────────────────

export const DEFAULT_COUNTERTOP_CONFIG: CountertopConfig = {
  thicknessMm: 28,
  overhangFrontMm: 30,
  overhangSidesMm: 20,
};
