export type DesignFooterStatus = {
  units: "mm";
  snap: string;
  zoom: string;
  selection: string;
  warnings: string;
};

export function formatDesignSnap(snapSizeMm: number, gridOn: boolean): string {
  return gridOn ? `${snapSizeMm} mm` : "Off";
}

export function formatDesignSelection(selectedCount: number): string {
  if (selectedCount <= 0) return "None";
  return selectedCount === 1 ? "1 selected" : `${selectedCount} selected`;
}

export function formatDesignWarnings(issues: readonly { severity: "error" | "warning" }[]): string {
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  const errors = issues.filter((issue) => issue.severity === "error").length;
  if (!warnings && !errors) return "No warnings";
  const parts: string[] = [];
  if (warnings) parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
  if (errors) parts.push(`${errors} error${errors === 1 ? "" : "s"}`);
  return parts.join(", ");
}

export function designFooterStatus(input: {
  snapSizeMm: number;
  gridOn: boolean;
  viewLabel: string;
  selectedCount: number;
  issues: readonly { severity: "error" | "warning" }[];
}): DesignFooterStatus {
  return {
    units: "mm",
    snap: formatDesignSnap(input.snapSizeMm, input.gridOn),
    zoom: input.viewLabel,
    selection: formatDesignSelection(input.selectedCount),
    warnings: formatDesignWarnings(input.issues),
  };
}

export function nextSnapSizeMm(current: number): number {
  const steps = [10, 25, 50, 100];
  const index = steps.indexOf(current);
  return steps[(index + 1) % steps.length] ?? 50;
}
