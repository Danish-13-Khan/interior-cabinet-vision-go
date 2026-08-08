import {
  getFootprintDimensions,
  type CabinetInstance,
  type CabinetProject,
} from "../cabinetDimensions";

export type SectionCutPlane = {
  id: string;
  mark: string;
  /** World X of vertical cut plane (mm). */
  xMm: number;
  /** Looking direction for the section sheet. */
  looking: "right" | "left";
  label: string;
  detailRef: string;
  cabinetId: string | null;
};

export function resolveSectionCutPlane(
  project: CabinetProject,
  options: {
    activeCabinetId?: string | null;
    selectedCabinetIds?: string[];
    cutPlaneXMm?: number;
    mark?: string;
  } = {},
): SectionCutPlane {
  const mark = options.mark ?? "A";
  const preferredId =
    options.activeCabinetId ??
    options.selectedCabinetIds?.find(Boolean) ??
    null;
  const preferred = preferredId
    ? project.cabinets.find((cabinet) => cabinet.id === preferredId)
    : null;
  const target =
    preferred ??
    project.cabinets.find((cabinet) => cabinet.placement.attachment === "floor") ??
    project.cabinets[0] ??
    null;

  const xMm =
    options.cutPlaneXMm ??
    (target ? target.placement.x : 0);

  return {
    id: `cut-${mark.toLowerCase()}`,
    mark,
    xMm,
    looking: "right",
    label: `SECTION ${mark}-${mark}`,
    detailRef: "DET-1",
    cabinetId: target?.id ?? null,
  };
}

export function cabinetsIntersectingCut(
  cabinets: CabinetInstance[],
  plane: SectionCutPlane,
  toleranceMm = 80,
): CabinetInstance[] {
  return cabinets.filter((cabinet) => {
    const fp = getFootprintDimensions(
      cabinet.config.dimensions,
      cabinet.placement.rotation,
    );
    const half = fp.width / 2;
    return (
      plane.xMm >= cabinet.placement.x - half - toleranceMm &&
      plane.xMm <= cabinet.placement.x + half + toleranceMm
    );
  });
}

export function isCabinetNearCut(
  cabinet: CabinetInstance,
  plane: SectionCutPlane,
  toleranceMm = 120,
) {
  const fp = getFootprintDimensions(
    cabinet.config.dimensions,
    cabinet.placement.rotation,
  );
  return Math.abs(cabinet.placement.x - plane.xMm) <= fp.width / 2 + toleranceMm;
}
