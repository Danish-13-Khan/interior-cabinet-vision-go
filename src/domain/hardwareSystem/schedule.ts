import type { CabinetInstance, CabinetType } from "../cabinetDimensions";
import { normalizeCabinetHardware } from "./normalize";
import type {
  ApplianceInsertKind,
  CabinetHardwareSummary,
  HardwareLine,
  HardwareScheduleRow,
} from "./types";

export function createHardwareSchedule(
  cabinets: CabinetInstance[],
  perCabinetLines: Map<string, HardwareLine[]>,
  marks?: Map<string, string>,
): { project: HardwareScheduleRow[]; byCabinet: CabinetHardwareSummary[] } {
  const rollup = new Map<
    string,
    HardwareScheduleRow & { markSet: Set<string> }
  >();
  const byCabinet: CabinetHardwareSummary[] = [];

  cabinets.forEach((cabinet, index) => {
    const lines = perCabinetLines.get(cabinet.id) ?? [];
    const mark = marks?.get(cabinet.id) ?? `C${String(index + 1).padStart(2, "0")}`;
    const hardware = normalizeCabinetHardware(
      cabinet.config.type,
      cabinet.config.hardware,
    );
    byCabinet.push({
      cabinetId: cabinet.id,
      cabinetName: cabinet.name,
      mark,
      insertKind: hardware.insertKind,
      lines,
      totalCost: lines.reduce((sum, line) => sum + line.totalCost, 0),
    });

    for (const line of lines) {
      const existing = rollup.get(line.id);
      if (!existing) {
        rollup.set(line.id, {
          hardwareId: line.id,
          label: line.label,
          kind: line.kind,
          quantity: line.quantity,
          unitCost: line.unitCost,
          totalCost: line.totalCost,
          cabinetCount: 1,
          cabinetMarks: [mark],
          markSet: new Set([mark]),
        });
        continue;
      }
      existing.quantity += line.quantity;
      existing.totalCost += line.totalCost;
      if (!existing.markSet.has(mark)) {
        existing.markSet.add(mark);
        existing.cabinetMarks.push(mark);
        existing.cabinetCount += 1;
      }
    }
  });

  const project = Array.from(rollup.values())
    .map(({ markSet: _markSet, ...row }) => ({
      ...row,
      totalCost: Math.round(row.totalCost),
    }))
    .sort((a, b) => b.totalCost - a.totalCost || a.label.localeCompare(b.label));

  return { project, byCabinet };
}

export function csvFromHardwareSchedule(rows: HardwareScheduleRow[]): string {
  const header = [
    "Hardware",
    "Kind",
    "Qty",
    "Unit Cost",
    "Total",
    "Cabinets",
    "Marks",
  ];
  const body = rows.map((row) => [
    row.label,
    row.kind,
    String(row.quantity),
    String(row.unitCost),
    String(row.totalCost),
    String(row.cabinetCount),
    row.cabinetMarks.join(" "),
  ]);
  return [header, ...body]
    .map((line) =>
      line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

/** Thin helper used by manufacturing / UI messages */
export function getInsertCompatibilityNotes(
  type: CabinetType,
  insertKind: ApplianceInsertKind,
): string[] {
  const notes: string[] = [];
  if (insertKind === "sink-bowl") {
    notes.push("Sink bowl insert: avoid drawers under bowl; trash pull-out is preferred.");
  }
  if (insertKind === "cooktop") {
    notes.push("Cooktop cutout: heat clearance required; drawers above heat zone discouraged.");
  }
  if (insertKind === "dishwasher-gap") {
    notes.push("Dishwasher gap: no carcass doors/drawers in this bay.");
  }
  if (type === "sink" && insertKind === "none") {
    notes.push("Sink cabinets should specify a sink-bowl insert.");
  }
  return notes;
}
