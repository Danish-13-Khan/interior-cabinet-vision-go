import { distMm } from "../proposalGeom";
import type { ArchitecturalScene } from "./archSceneTypes";
import { findOpenLoops } from "./roomSurfaces";

export type GateIssue = {
  id: string;
  severity: "error" | "warn" | "info";
  message: string;
};

export type ReconstructionGate = {
  pass: boolean;
  issues: GateIssue[];
  confidenceSummary: { low: number; medium: number; high: number };
};

/** Phase 14: production gate before Accept into customer project. */
export function evaluateReconstructionGate(scene: ArchitecturalScene): ReconstructionGate {
  const issues: GateIssue[] = [];
  if (scene.walls.length < 3) {
    issues.push({ id: "walls", severity: "error", message: "Fewer than 3 walls." });
  }
  const openEnds = findOpenLoops(scene.walls);
  if (openEnds.length > 2) {
    issues.push({
      id: "open-loops",
      severity: "warn",
      message: `${openEnds.length} dangling wall endpoints.`,
    });
  }
  for (const op of scene.openings) {
    if (!scene.walls.some((w) => w.id === op.wallId)) {
      issues.push({
        id: `orphan-${op.id}`,
        severity: "error",
        message: `Opening ${op.id} has no host wall.`,
      });
    }
  }
  for (const w of scene.walls) {
    if (distMm(w.start, w.end) < 100) {
      issues.push({
        id: `short-${w.id}`,
        severity: "warn",
        message: `Wall ${w.id} shorter than 100mm.`,
      });
    }
  }
  if (!scene.floors.length) {
    issues.push({ id: "floors", severity: "warn", message: "No floor surfaces derived." });
  }

  const confidenceSummary = { low: 0, medium: 0, high: 0 };
  for (const w of scene.walls) confidenceSummary[w.confidence] += 1;
  for (const f of scene.fixtures) confidenceSummary[f.confidence] += 1;

  const pass = !issues.some((i) => i.severity === "error");
  return { pass, issues, confidenceSummary };
}
