export type DraftingViewTarget = "top" | "front" | "side" | "all";
export type DraftingSheetView = "top" | "front" | "side";

export type DraftingWorldPoint = {
  x: number;
  y: number;
  z: number;
};

export type DraftingNote = {
  id: string;
  view: DraftingViewTarget;
  text: string;
  anchor: DraftingWorldPoint;
};

export type DraftingLeader = {
  id: string;
  view: DraftingViewTarget;
  text: string;
  target: DraftingWorldPoint;
  label: DraftingWorldPoint;
};

export type DraftingDimOffset = {
  id: string;
  dx: number;
  dy: number;
};

export type DraftingTagOffset = {
  cabinetId: string;
  dx: number;
  dy: number;
};

export type ProjectDrafting = {
  notes: DraftingNote[];
  leaders: DraftingLeader[];
  dimOffsets?: DraftingDimOffset[];
  tagOffsets?: DraftingTagOffset[];
};

export type DraftingDisplayPreferences = {
  showCabinetTags: boolean;
  showOpeningTags: boolean;
  showApplianceTags: boolean;
  showDimensionChains: boolean;
  showWallLabels: boolean;
  showRunBands: boolean;
  showRunLabels: boolean;
  showFillers: boolean;
  showCountertopSpans: boolean;
  dimMinSegmentMm: number;
};

export const DEFAULT_DRAFTING: ProjectDrafting = {
  notes: [],
  leaders: [],
};

export const DEFAULT_DRAFTING_DISPLAY: DraftingDisplayPreferences = {
  showCabinetTags: true,
  showOpeningTags: true,
  showApplianceTags: true,
  showDimensionChains: true,
  showWallLabels: true,
  showRunBands: true,
  showRunLabels: true,
  showFillers: true,
  showCountertopSpans: true,
  dimMinSegmentMm: 40,
};

export const MAX_DRAFTING_ANNOTATIONS = 40;

function isViewTarget(value: unknown): value is DraftingViewTarget {
  return value === "top" || value === "front" || value === "side" || value === "all";
}

function clampPoint(point: Partial<DraftingWorldPoint> | undefined): DraftingWorldPoint {
  return {
    x: Number.isFinite(point?.x) ? Number(point?.x) : 0,
    y: Number.isFinite(point?.y) ? Number(point?.y) : 0,
    z: Number.isFinite(point?.z) ? Number(point?.z) : 0,
  };
}

export function createDraftingId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function formatCabinetTag(index: number) {
  return `C${String(index + 1).padStart(2, "0")}`;
}

export function formatOpeningTag(
  kind: "door" | "window",
  index: number,
  widthMm: number,
  heightMm: number,
  sillHeightMm?: number,
) {
  const code = kind === "door" ? "DR" : "WN";
  const size = `${Math.round(widthMm)}×${Math.round(heightMm)}`;
  if (kind === "window" && typeof sillHeightMm === "number") {
    return `${code}-${index + 1} ${size} S${Math.round(sillHeightMm)}`;
  }
  return `${code}-${index + 1} ${size}`;
}

/** Shop marker for cabinet-face openings (doors, drawers, shelves). */
export function formatFaceOpeningTag(contentType: string, index: number) {
  const code =
    contentType === "door"
      ? "OP"
      : contentType === "drawer-stack"
        ? "DW"
        : contentType === "open-shelf"
          ? "SH"
          : contentType === "divider"
            ? "DV"
            : "OC";
  return `${code}-${index + 1}`;
}

export function formatCabinetElevationLabel(
  tag: string,
  name: string,
  widthMm: number,
  heightMm: number,
) {
  const short = name.length > 16 ? `${name.slice(0, 15)}…` : name;
  return `${tag} · ${short} · ${Math.round(widthMm)}×${Math.round(heightMm)}`;
}

export function formatApplianceTag(type: string) {
  switch (type) {
    case "sink":
      return "APPL · SINK";
    case "corner":
      return "APPL · CORNER";
    default:
      return null;
  }
}

export function clampDraftingDisplay(
  value: Partial<DraftingDisplayPreferences> | undefined,
): DraftingDisplayPreferences {
  const merged = { ...DEFAULT_DRAFTING_DISPLAY, ...(value ?? {}) };
  const minSeg = Number(merged.dimMinSegmentMm);
  return {
    showCabinetTags: merged.showCabinetTags !== false,
    showOpeningTags: merged.showOpeningTags !== false,
    showApplianceTags: merged.showApplianceTags !== false,
    showDimensionChains: merged.showDimensionChains !== false,
    showWallLabels: merged.showWallLabels !== false,
    showRunBands: merged.showRunBands !== false,
    showRunLabels: merged.showRunLabels !== false,
    showFillers: merged.showFillers !== false,
    showCountertopSpans: merged.showCountertopSpans !== false,
    dimMinSegmentMm:
      Number.isFinite(minSeg) ? Math.min(200, Math.max(10, Math.round(minSeg))) : 40,
  };
}

export function clampProjectDrafting(
  drafting: Partial<ProjectDrafting> | undefined,
): ProjectDrafting {
  const notes = Array.isArray(drafting?.notes) ? drafting!.notes : [];
  const leaders = Array.isArray(drafting?.leaders) ? drafting!.leaders : [];
  const dimOffsets = Array.isArray(drafting?.dimOffsets) ? drafting!.dimOffsets : [];
  const tagOffsets = Array.isArray(drafting?.tagOffsets) ? drafting!.tagOffsets : [];

  const safeNotes: DraftingNote[] = notes
    .slice(0, MAX_DRAFTING_ANNOTATIONS)
    .map((note, index) => ({
      id: note.id || `note-${index + 1}`,
      view: isViewTarget(note.view) ? note.view : "all",
      text: String(note.text ?? "").trim().slice(0, 120) || "Note",
      anchor: clampPoint(note.anchor),
    }));

  const remaining = Math.max(0, MAX_DRAFTING_ANNOTATIONS - safeNotes.length);
  const safeLeaders: DraftingLeader[] = leaders.slice(0, remaining).map((leader, index) => ({
    id: leader.id || `leader-${index + 1}`,
    view: isViewTarget(leader.view) ? leader.view : "all",
    text: String(leader.text ?? "").trim().slice(0, 80) || "Callout",
    target: clampPoint(leader.target),
    label: clampPoint(leader.label),
  }));

  const safeDimOffsets: DraftingDimOffset[] = dimOffsets
    .slice(0, 80)
    .map((item, index) => ({
      id: String(item.id || `dim-${index + 1}`),
      dx: Number.isFinite(item.dx) ? Math.max(-120, Math.min(120, Number(item.dx))) : 0,
      dy: Number.isFinite(item.dy) ? Math.max(-120, Math.min(120, Number(item.dy))) : 0,
    }))
    .filter((item) => item.dx !== 0 || item.dy !== 0);

  const safeTagOffsets: DraftingTagOffset[] = tagOffsets
    .slice(0, 80)
    .map((item) => ({
      cabinetId: String(item.cabinetId || ""),
      dx: Number.isFinite(item.dx) ? Math.max(-120, Math.min(120, Number(item.dx))) : 0,
      dy: Number.isFinite(item.dy) ? Math.max(-120, Math.min(120, Number(item.dy))) : 0,
    }))
    .filter((item) => item.cabinetId && (item.dx !== 0 || item.dy !== 0));

  return {
    notes: safeNotes,
    leaders: safeLeaders,
    dimOffsets: safeDimOffsets,
    tagOffsets: safeTagOffsets,
  };
}

export function draftingVisibleInView(
  itemView: DraftingViewTarget,
  current: DraftingSheetView,
) {
  return itemView === "all" || itemView === current;
}

export function escapeDraftingXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderNoteSvg(
  x: number,
  y: number,
  text: string,
  options: { id?: string; selected?: boolean } = {},
) {
  const label = escapeDraftingXml(text);
  const width = Math.min(160, Math.max(48, label.length * 5.2 + 12));
  const selected = options.selected ? " is-selected" : "";
  const idAttr = options.id
    ? ` data-note-id="${escapeDraftingXml(options.id)}" data-draft-object="note"`
    : "";
  return [
    `<rect x="${x}" y="${y - 11}" width="${width}" height="16" rx="2" class="twod-note${selected}"${idAttr} style="cursor:move" />`,
    `<text x="${x + 6}" y="${y}" class="twod-note-text" font-size="8" fill="#92400e" pointer-events="none">${label}</text>`,
  ];
}

export function renderLeaderSvg(
  targetX: number,
  targetY: number,
  labelX: number,
  labelY: number,
  text: string,
  options: { id?: string; selected?: boolean } = {},
) {
  const label = escapeDraftingXml(text);
  const width = Math.min(140, Math.max(40, label.length * 5.2 + 10));
  const selected = options.selected ? " is-selected" : "";
  const id = options.id ? escapeDraftingXml(options.id) : "";
  const idAttr = id
    ? ` data-leader-id="${id}" data-draft-object="leader"`
    : "";
  return [
    `<line x1="${targetX}" y1="${targetY}" x2="${labelX}" y2="${labelY}" class="twod-leader${selected}"${idAttr} pointer-events="none" />`,
    `<circle cx="${targetX}" cy="${targetY}" r="4" class="twod-leader-handle twod-leader-target${selected}"${idAttr} data-leader-handle="target" style="cursor:move" />`,
    `<rect x="${labelX}" y="${labelY - 11}" width="${width}" height="16" rx="2" class="twod-leader-label${selected}"${idAttr} data-leader-handle="label" style="cursor:move" />`,
    `<text x="${labelX + 5}" y="${labelY}" class="twod-leader-text" font-size="8" fill="#0f172a" pointer-events="none">${label}</text>`,
  ];
}

export function renderCabinetTagSvg(
  x: number,
  y: number,
  tag: string,
  options: { cabinetId?: string; selected?: boolean } = {},
) {
  const label = escapeDraftingXml(tag);
  const width = Math.max(28, label.length * 6 + 8);
  const selected = options.selected ? " is-selected" : "";
  const idAttr = options.cabinetId
    ? ` data-tag-cabinet-id="${escapeDraftingXml(options.cabinetId)}" data-draft-object="tag"`
    : "";
  return [
    `<rect x="${x - width / 2}" y="${y - 8}" width="${width}" height="12" rx="2" class="twod-tag twod-tag-cabinet${selected}"${idAttr} style="cursor:move" />`,
    `<text x="${x}" y="${y + 1}" class="twod-tag-text" font-size="7.5" font-weight="700" fill="#f8fafc" text-anchor="middle" pointer-events="none">${label}</text>`,
  ];
}

export function worldPointForView(
  view: DraftingSheetView,
  clientWorld: { x: number; y: number; z: number },
): DraftingWorldPoint {
  if (view === "front") {
    return { x: clientWorld.x, y: clientWorld.y, z: 0 };
  }
  if (view === "side") {
    return { x: 0, y: clientWorld.y, z: clientWorld.z };
  }
  return { x: clientWorld.x, y: 0, z: clientWorld.z };
}
