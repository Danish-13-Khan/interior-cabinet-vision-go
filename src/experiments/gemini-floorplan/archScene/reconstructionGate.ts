import { distMm } from "../proposalGeom";
import type { ArchitecturalScene } from "./archSceneTypes";
import { findOpenLoops } from "./roomSurfaces";

export type GateIssue = {
  id: string;
  severity: "error" | "warn" | "info";
  message: string;
  entityId?: string;
};

export type ReconstructionGate = {
  pass: boolean;
  issues: GateIssue[];
  confidenceSummary: { low: number; medium: number; high: number };
  heatmap: Array<{ entityId: string; confidence: "low" | "medium" | "high"; kind: string }>;
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
        entityId: op.id,
      });
    }
  }
  for (const w of scene.walls) {
    const len = distMm(w.start, w.end);
    if (len < 100) {
      issues.push({
        id: `short-${w.id}`,
        severity: "warn",
        message: `Wall ${w.id} shorter than 100mm.`,
        entityId: w.id,
      });
    }
    if (len > 50000) {
      issues.push({
        id: `huge-${w.id}`,
        severity: "error",
        message: `Wall ${w.id} over 50m — impossible dimension.`,
        entityId: w.id,
      });
    }
  }
  // Near-duplicate / overlapping parallel walls
  for (let i = 0; i < scene.walls.length; i++) {
    for (let j = i + 1; j < scene.walls.length; j++) {
      const a = scene.walls[i];
      const b = scene.walls[j];
      const midA = { x: (a.start.x + a.end.x) / 2, y: (a.start.y + a.end.y) / 2 };
      const midB = { x: (b.start.x + b.end.x) / 2, y: (b.start.y + b.end.y) / 2 };
      if (distMm(midA, midB) < 80 && Math.abs(distMm(a.start, a.end) - distMm(b.start, b.end)) < 200) {
        issues.push({
          id: `overlap-${a.id}-${b.id}`,
          severity: "warn",
          message: `Possible overlapping walls ${a.id} / ${b.id}.`,
          entityId: a.id,
        });
      }
    }
  }
  if (!scene.floors.length) {
    issues.push({ id: "floors", severity: "warn", message: "No floor surfaces derived." });
  }
  const pending = scene.fixtures.filter((f) => f.review === "pending").length;
  if (pending > 0) {
    issues.push({
      id: "fixtures-pending",
      severity: "info",
      message: `${pending} fixtures awaiting accept/reject.`,
    });
  }
  const unknown = scene.fixtures.filter((f) => f.type === "unknown").length;
  if (unknown > 0) {
    issues.push({
      id: "unknown-fixtures",
      severity: "warn",
      message: `${unknown} unknown Vision symbols.`,
    });
  }

  const confidenceSummary = { low: 0, medium: 0, high: 0 };
  const heatmap: ReconstructionGate["heatmap"] = [];
  for (const w of scene.walls) {
    confidenceSummary[w.confidence] += 1;
    heatmap.push({ entityId: w.id, confidence: w.confidence, kind: "wall" });
  }
  for (const f of scene.fixtures) {
    confidenceSummary[f.confidence] += 1;
    heatmap.push({ entityId: f.id, confidence: f.confidence, kind: "fixture" });
  }

  const pass = !issues.some((i) => i.severity === "error");
  return { pass, issues, confidenceSummary, heatmap };
}
