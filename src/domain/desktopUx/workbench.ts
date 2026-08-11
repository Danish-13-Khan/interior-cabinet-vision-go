export const WORKBENCH_MODES = [
  "job",
  "room",
  "interiors",
  "cabinets",
  "drawings",
  "production",
  "reports",
] as const;

export type WorkbenchMode = (typeof WORKBENCH_MODES)[number];

export const WORKBENCH_LABELS: Record<WorkbenchMode, string> = {
  job: "Job",
  room: "Room",
  interiors: "Interiors",
  cabinets: "Cabinets",
  drawings: "Drawings",
  production: "Production",
  reports: "Reports",
};

export function normalizeWorkbenchMode(value: unknown): WorkbenchMode {
  return WORKBENCH_MODES.includes(value as WorkbenchMode)
    ? (value as WorkbenchMode)
    : "cabinets";
}

export function workbenchBreadcrumb(
  mode: WorkbenchMode,
  roomName: string,
  cabinetName?: string | null,
) {
  const segments = ["Job", roomName];
  if (mode === "interiors") segments.push("Interior Plan");
  if (mode === "cabinets" && cabinetName) segments.push(cabinetName);
  if (mode === "drawings") segments.push("Drawings");
  if (mode === "production") segments.push("Production");
  if (mode === "reports") segments.push("Reports");
  return segments.join(" > ");
}
