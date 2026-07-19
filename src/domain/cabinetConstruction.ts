// ── Cabinet Construction Details ────────────────────────────
// Augments the base CabinetConfig with workshop-level construction options.

import type { CabinetDimensions } from "./cabinetDimensions";

// ── Component Types ─────────────────────────────────────────

export type SidePanel = {
  label: string;       // e.g. "Left Side Panel"
  thicknessMm: number; // board thickness for this panel
  widthMm: number;     // = cabinet depth
  heightMm: number;    // = cabinet height
  grain: GrainDirection;
};

export type BackPanel = {
  label: string;
  thicknessMm: number;
  widthMm: number;    // = internal width
  heightMm: number;   // = internal height (between top/bottom)
  grain: GrainDirection;
  rabbeted: boolean;  // inset into side panels
};

export type Shelf = {
  label: string;
  thicknessMm: number;
  widthMm: number;    // internal width
  depthMm: number;    // internal depth - back panel
  count: number;      // number of identical shelves
  grain: GrainDirection;
  adjustable: boolean;
};

export type Partition = {
  label: string;
  thicknessMm: number;
  depthMm: number;
  heightMm: number;   // internal height
  offsetFromLeftMm: number;
  grain: GrainDirection;
};

export type DrawerBox = {
  label: string;
  frontThicknessMm: number;
  sideThicknessMm: number;
  bottomThicknessMm: number;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  slideType: "side-mount" | "under-mount";
  count: number;
  grain: GrainDirection;
};

export type DrawerFront = {
  label: string;
  thicknessMm: number;
  widthMm: number;
  heightMm: number;
  overlay: "full-overlay" | "inset" | "half-overlay";
  count: number;
  grain: GrainDirection;
};

export type FillerPanel = {
  label: string;
  thicknessMm: number;
  widthMm: number;
  heightMm: number;
  grain: GrainDirection;
};

export type EndPanel = {
  label: string;
  thicknessMm: number;
  widthMm: number;    // = depth
  heightMm: number;   // = height
  side: "left" | "right";
  grain: GrainDirection;
};

export type Stretcher = {
  label: string;
  thicknessMm: number;
  widthMm: number;    // internal width
  depthMm: number;    // ~80mm typical
  count: number;      // typically 2 (top + bottom back)
  grain: GrainDirection;
};

// ── Construction Style ───────────────────────────────────────

export type ConstructionStyle = "frameless" | "face-frame";

export type FaceFrameConfig = {
  enabled: boolean;
  stileWidthMm: number;
  railWidthMm: number;
  thicknessMm: number;
};

// ── Grain Direction ──────────────────────────────────────────

export type GrainDirection = "vertical" | "horizontal" | "none";

// ── Full Construction Configuration ──────────────────────────

export type CabinetConstruction = {
  style: ConstructionStyle;
  faceFrame?: FaceFrameConfig;

  sides: SidePanel[];          // 2 typically
  back: BackPanel | null;
  topBottomThicknessMm: number; // shared thickness for top+ bottom panels

  shelves: Shelf[];
  partitions: Partition[];
  drawers: DrawerBox[];
  drawerFronts: DrawerFront[];
  fillers: FillerPanel[];
  endPanels: EndPanel[];
  stretchers: Stretcher[];
  toeKickHeightMm: number;
  toeKickInsetMm: number;

  hasDoors: boolean;
  doorOverlay: "full-overlay" | "inset" | "half-overlay";
  doorWidthMm: number;
  doorHeightMm: number;
};

// ── Default Construction ─────────────────────────────────────

export function defaultConstruction(
  outerDims: CabinetDimensions,
): CabinetConstruction {
  const bw = outerDims.boardThickness;
  const bpH = outerDims.backPanelThickness;
  const iw = outerDims.width - bw * 2;
  const ih = outerDims.height - bw * 2 - 100; // subtract toe kick

  return {
    style: "frameless",
    sides: [
      { label: "Left Side", thicknessMm: bw, widthMm: outerDims.depth, heightMm: outerDims.height, grain: "vertical" },
      { label: "Right Side", thicknessMm: bw, widthMm: outerDims.depth, heightMm: outerDims.height, grain: "vertical" },
    ],
    back: { label: "Back Panel", thicknessMm: bpH, widthMm: iw, heightMm: ih, grain: "horizontal", rabbeted: true },
    topBottomThicknessMm: bw,
    shelves: [],
    partitions: [],
    drawers: [],
    drawerFronts: [],
    fillers: [],
    endPanels: [],
    stretchers: [],
    toeKickHeightMm: 100,
    toeKickInsetMm: 60,
    hasDoors: false,
    doorOverlay: "full-overlay",
    doorWidthMm: iw / 2 - 2,
    doorHeightMm: ih,
  };
}

// ── Helpers ──────────────────────────────────────────────────

export function getConstructionFlatParts(cc: CabinetConstruction): {
  label: string; key: string; qty: number; lengthMm: number; widthMm: number;
  thicknessMm: number; grain: GrainDirection; category: string;
}[] {
  const parts: ReturnType<typeof getConstructionFlatParts> = [];

  // Sides
  for (const s of cc.sides) {
    parts.push({ label: s.label, key: s.label, qty: 1, lengthMm: s.heightMm, widthMm: s.widthMm, thicknessMm: s.thicknessMm, grain: s.grain, category: "Side" });
  }

  // Top + Bottom (shared thickness)
  ({}) // dummy usage
  const outer = cc.sides[0]; // reference
  const ih = outer ? outer.heightMm - cc.topBottomThicknessMm * 2 - cc.toeKickHeightMm : 0;
  parts.push(
    { label: "Top Panel", key: "top", qty: 1, lengthMm: outer ? ih + cc.topBottomThicknessMm : 0, widthMm: outer ? outer.widthMm : 0, thicknessMm: cc.topBottomThicknessMm, grain: "horizontal", category: "Top/Bottom" },
    { label: "Bottom Panel", key: "bottom", qty: 1, lengthMm: outer ? ih + cc.topBottomThicknessMm : 0, widthMm: outer ? outer.widthMm : 0, thicknessMm: cc.topBottomThicknessMm, grain: "horizontal", category: "Top/Bottom" },
  );

  // Back
  if (cc.back) {
    parts.push({ label: cc.back.label, key: "back", qty: 1, lengthMm: cc.back.heightMm, widthMm: cc.back.widthMm, thicknessMm: cc.back.thicknessMm, grain: cc.back.grain, category: "Back" });
  }

  // Shelves
  for (const s of cc.shelves) {
    parts.push({ label: s.label, key: s.label, qty: s.count, lengthMm: s.widthMm, widthMm: s.depthMm, thicknessMm: s.thicknessMm, grain: s.grain, category: "Shelf" });
  }

  // Partitions
  for (const p of cc.partitions) {
    parts.push({ label: p.label, key: p.label, qty: 1, lengthMm: p.heightMm, widthMm: p.depthMm, thicknessMm: p.thicknessMm, grain: p.grain, category: "Partition" });
  }

  // Drawer boxes
  for (const d of cc.drawers) {
    parts.push(
      { label: `${d.label} Front`, key: `${d.label}-front`, qty: d.count, lengthMm: d.heightMm, widthMm: d.widthMm, thicknessMm: d.frontThicknessMm, grain: d.grain, category: "Drawer" },
      { label: `${d.label} Side`, key: `${d.label}-side`, qty: d.count * 2, lengthMm: d.depthMm, widthMm: d.heightMm, thicknessMm: d.sideThicknessMm, grain: "horizontal", category: "Drawer" },
      { label: `${d.label} Bottom`, key: `${d.label}-bottom`, qty: d.count, lengthMm: d.widthMm, widthMm: d.depthMm, thicknessMm: d.bottomThicknessMm, grain: "horizontal", category: "Drawer" },
    );
  }

  // Drawer fronts
  for (const df of cc.drawerFronts) {
    parts.push({ label: df.label, key: df.label, qty: df.count, lengthMm: df.heightMm, widthMm: df.widthMm, thicknessMm: df.thicknessMm, grain: df.grain, category: "DrawerFront" });
  }

  // Fillers
  for (const f of cc.fillers) {
    parts.push({ label: f.label, key: f.label, qty: 1, lengthMm: f.heightMm, widthMm: f.widthMm, thicknessMm: f.thicknessMm, grain: f.grain, category: "Filler" });
  }

  // End panels
  for (const ep of cc.endPanels) {
    parts.push({ label: ep.label, key: ep.label, qty: 1, lengthMm: ep.heightMm, widthMm: ep.widthMm, thicknessMm: ep.thicknessMm, grain: ep.grain, category: "EndPanel" });
  }

  // Stretchers
  for (const st of cc.stretchers) {
    parts.push({ label: st.label, key: st.label, qty: st.count, lengthMm: st.widthMm, widthMm: st.depthMm, thicknessMm: st.thicknessMm, grain: st.grain, category: "Stretcher" });
  }

  // Doors
  if (cc.hasDoors) {
    parts.push(
      { label: "Left Door", key: "left-door", qty: 1, lengthMm: cc.doorHeightMm, widthMm: cc.doorWidthMm, thicknessMm: cc.topBottomThicknessMm, grain: "vertical", category: "Door" },
      { label: "Right Door", key: "right-door", qty: 1, lengthMm: cc.doorHeightMm, widthMm: cc.doorWidthMm, thicknessMm: cc.topBottomThicknessMm, grain: "vertical", category: "Door" },
    );
  }

  // Toe Kick
  if (cc.toeKickHeightMm > 0) {
    const tw = outer ? outer.widthMm - cc.sides[0].thicknessMm * 2 : 0;
    parts.push({ label: "Toe Kick", key: "toe-kick", qty: 1, lengthMm: tw, widthMm: cc.toeKickHeightMm, thicknessMm: cc.topBottomThicknessMm, grain: "horizontal", category: "ToeKick" });
  }

  // Face frame parts
  if (cc.faceFrame?.enabled) {
    const ff = cc.faceFrame;
    const stileH = outer ? outer.heightMm - cc.toeKickHeightMm : 0;
    parts.push(
      { label: "Left Stile", key: "left-stile", qty: 1, lengthMm: stileH, widthMm: ff.stileWidthMm, thicknessMm: ff.thicknessMm, grain: "vertical", category: "FaceFrame" },
      { label: "Right Stile", key: "right-stile", qty: 1, lengthMm: stileH, widthMm: ff.stileWidthMm, thicknessMm: ff.thicknessMm, grain: "vertical", category: "FaceFrame" },
    );
    if (ff.railWidthMm > 0) {
      const rw = outer ? outer.widthMm - ff.stileWidthMm * 2 : 0;
      parts.push(
        { label: "Top Rail", key: "top-rail", qty: 1, lengthMm: rw, widthMm: ff.railWidthMm, thicknessMm: ff.thicknessMm, grain: "horizontal", category: "FaceFrame" },
        { label: "Bottom Rail", key: "bottom-rail", qty: 1, lengthMm: rw, widthMm: ff.railWidthMm, thicknessMm: ff.thicknessMm, grain: "horizontal", category: "FaceFrame" },
      );
    }
  }

  return parts;
}
