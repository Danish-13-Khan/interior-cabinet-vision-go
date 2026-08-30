import type { CabinetInstance, CabinetProject } from "../cabinetDimensions";
import { createCabinetConstruction } from "../cabinetConstruction";
import type { CabinetConstructionSpec } from "../cabinetConstructionSpec";
import { BACK_PANEL_RULES } from "../materialSystem";
import {
  createCabinetProductionCutlist,
  type ProductionCutlistLine,
} from "../productionCutlist";
import { createExportableProjectCutlist } from "../productionOutputs";
import {
  MACHINE_EXPORT_DISCLAIMER,
  MACHINE_EXPORT_SCHEMA_VERSION,
  type MachineJobDocument,
  type MachineOperation,
  type MachinePartMetadata,
  type PartOrientation,
} from "./types";
import { summarizeMachiningPreview } from "./preview";
import {
  clampJobMeta,
  createDefaultJobMeta,
  formatJobTitle,
} from "../jobMeta";

function grainAlong(grain: string): PartOrientation["grainAlong"] {
  if (grain === "lengthwise") return "length";
  if (grain === "widthwise") return "width";
  return "none";
}

function orientationFromLine(line: ProductionCutlistLine): PartOrientation {
  return {
    faceUp: line.category === "Back" || line.category === "Door" ? "outside" : "either",
    grainAlong: grainAlong(line.grain),
    originCorner: "bottom-left",
    rotationDeg: 0,
  };
}

function cutOutlineOperation(line: ProductionCutlistLine): MachineOperation {
  return {
    id: `${line.shopRef}-cut`,
    kind: "cut-outline",
    label: "Cut blank",
    status: "preview",
    description: `Rectangular blank ${line.lengthMm} × ${line.widthMm} × ${line.thicknessMm} mm`,
    geometry: {
      lengthMm: line.lengthMm,
      widthMm: line.widthMm,
      depthMm: line.thicknessMm,
    },
    toolHint: "panel-saw / nested cut (intent)",
    source: {
      shopRef: line.shopRef,
      partId: line.partId,
      cabinetId: line.cabinetId,
      notes: line.notes,
    },
  };
}

function operationsFromNotes(
  line: ProductionCutlistLine,
  spec: CabinetConstructionSpec | null,
): MachineOperation[] {
  const ops: MachineOperation[] = [];
  const notes = (line.notes ?? "").toLowerCase();
  const baseSource = {
    shopRef: line.shopRef,
    partId: line.partId,
    cabinetId: line.cabinetId,
    notes: line.notes,
  };

  if (notes.includes("dado") || notes.includes("housed") || notes.includes("groove")) {
    ops.push({
      id: `${line.shopRef}-groove-note`,
      kind: "groove",
      label: "Groove / dado intent",
      status: "intent",
      description: line.notes || "Groove or dado joinery called out on part notes",
      toolHint: "router / CNC groove (not programmed)",
      source: baseSource,
    });
  }

  if (notes.includes("rabbet") || notes.includes("rebate")) {
    ops.push({
      id: `${line.shopRef}-rebate-note`,
      kind: "rebate",
      label: "Rebate intent",
      status: "intent",
      description: line.notes || "Rebate joinery called out on part notes",
      toolHint: "router rebate (not programmed)",
      source: baseSource,
    });
  }

  if (notes.includes("confirmat") || notes.includes("screw") || notes.includes("dovetail")) {
    ops.push({
      id: `${line.shopRef}-joinery-note`,
      kind: "joinery-note",
      label: "Joinery intent",
      status: "intent",
      description: line.notes || "Joinery note from construction",
      source: baseSource,
    });
  }

  if (line.category === "Back") {
    const rebateMm = BACK_PANEL_RULES.grooved.rebateMm;
    if (notes.includes("groove") || notes.includes("rebate") || rebateMm > 0) {
      // Only emit rebate intent when construction uses grooved backs (checked via notes/spec)
      const wantsGroove =
        notes.includes("groove") ||
        notes.includes("rebate") ||
        notes.includes("grooved");
      if (wantsGroove) {
        ops.push({
          id: `${line.shopRef}-back-rebate`,
          kind: "rebate",
          label: "Back panel rebate intent",
          status: "intent",
          description: `Back panel rebate intent (~${rebateMm} mm) — depth not machine-verified`,
          geometry: { depthMm: rebateMm },
          toolHint: "edge rebate (intent)",
          source: baseSource,
        });
      }
    }
  }

  if (line.category === "Side" && spec) {
    if (spec.caseJoinery === "dado" || spec.caseJoinery === "rabbet") {
      ops.push({
        id: `${line.shopRef}-case-${spec.caseJoinery}`,
        kind: spec.caseJoinery === "dado" ? "groove" : "rebate",
        label: `Case ${spec.caseJoinery} intent`,
        status: "intent",
        description: `Side panel case joinery: ${spec.caseJoinery} (no hole/path coordinates)`,
        toolHint: "case joinery (intent)",
        source: baseSource,
      });
    }
    if (spec.shelfMount === "adjustable-pins") {
      ops.push({
        id: `${line.shopRef}-shelf-pins`,
        kind: "drill",
        label: "Shelf pin holes (intent)",
        status: "intent",
        description:
          "Adjustable shelf pin drilling intent — hole pattern not generated",
        toolHint: "shelf-pin drill (not programmed)",
        geometry: { diameterMm: 5 },
        source: baseSource,
      });
    }
    if (spec.shelfMount === "fixed-dado") {
      ops.push({
        id: `${line.shopRef}-shelf-dado`,
        kind: "groove",
        label: "Fixed shelf dado intent",
        status: "intent",
        description: "Fixed shelf housed in side dados — path not generated",
        toolHint: "shelf dado (intent)",
        source: baseSource,
      });
    }
  }

  if (line.category === "Door") {
    ops.push({
      id: `${line.shopRef}-hinge-cups`,
      kind: "hardware-intent",
      label: "Hinge cup drilling (intent)",
      status: "intent",
      description: "Door hinge cup / mounting intent — positions not generated",
      toolHint: "hinge boring (not programmed)",
      geometry: { diameterMm: 35 },
      source: baseSource,
    });
  }

  if (
    (line.category === "DrawerBox" || line.category === "DrawerFront") &&
    spec?.drawerBoxStyle === "dado-bottom"
  ) {
    ops.push({
      id: `${line.shopRef}-drawer-groove`,
      kind: "groove",
      label: "Drawer bottom groove intent",
      status: "intent",
      description: "Drawer bottom housed in grooves — path not generated",
      toolHint: "drawer groove (intent)",
      source: baseSource,
    });
  }

  return ops;
}

function dedupeOps(ops: MachineOperation[]): MachineOperation[] {
  const seen = new Set<string>();
  return ops.filter((op) => {
    if (seen.has(op.id)) return false;
    seen.add(op.id);
    return true;
  });
}

export function buildMachinePartFromCutlistLine(
  line: ProductionCutlistLine,
  spec: CabinetConstructionSpec | null = null,
): MachinePartMetadata {
  const operations = dedupeOps([
    cutOutlineOperation(line),
    ...operationsFromNotes(line, spec),
  ]);

  return {
    shopRef: line.shopRef,
    partId: line.partId,
    cabinetId: line.cabinetId,
    cabinetName: line.cabinetName,
    label: line.label,
    category: String(line.category),
    quantity: line.quantity,
    blank: {
      lengthMm: line.lengthMm,
      widthMm: line.widthMm,
      thicknessMm: line.thicknessMm,
      material: line.material,
      finish: line.finish,
      edgeBanding: line.edgeBanding,
    },
    orientation: orientationFromLine(line),
    operations,
  };
}

function specForCabinet(cabinet: CabinetInstance): CabinetConstructionSpec {
  return createCabinetConstruction(cabinet.config).constructionSpec;
}

export function createMachineJobDocument(
  project: CabinetProject,
  lines: ProductionCutlistLine[] = createExportableProjectCutlist(project),
): MachineJobDocument {
  const job = clampJobMeta(project.job ?? createDefaultJobMeta());
  const specByCabinet = new Map(
    project.cabinets.map((cabinet) => [cabinet.id, specForCabinet(cabinet)] as const),
  );

  const parts = lines.map((line) =>
    buildMachinePartFromCutlistLine(line, specByCabinet.get(line.cabinetId) ?? null),
  );

  return {
    schemaVersion: MACHINE_EXPORT_SCHEMA_VERSION,
    format: "cabinet-designer-machine-json",
    disclaimer: MACHINE_EXPORT_DISCLAIMER,
    generatedAt: new Date().toISOString(),
    job: {
      projectNumber: job.projectNumber || "—",
      revision: job.revision,
      customerName: job.customerName || "—",
      title: formatJobTitle(job, "Cabinet Project"),
    },
    summary: summarizeMachiningPreview(parts),
    parts,
  };
}

export function createCabinetMachineParts(
  cabinet: CabinetInstance,
  cabinetIndex = 1,
): MachinePartMetadata[] {
  const lines = createCabinetProductionCutlist(cabinet, cabinetIndex);
  const spec = specForCabinet(cabinet);
  return lines.map((line) => buildMachinePartFromCutlistLine(line, spec));
}
