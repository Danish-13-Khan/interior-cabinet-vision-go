import { supportsDoors, supportsDrawers, type CabinetConfig } from "../cabinetDimensions";
import { DOOR_GAP, normalizeConstructionSpec, type DoorMount } from "../cabinetConstructionSpec";
import { golaProfilesForType, type GolaProfileKind, type GolaProfiles } from "../frontSystem/golaProfiles";
import { APPLY_PUSH_LATCH_BUFFER, PUSH_LATCH_BUFFER_MM } from "../frontSystem/pushDefaults";
import { layoutCabinetElevationFace, type OpeningFaceRect } from "../openingLayout";
import { resolveSlidingFronts } from "./slidingFronts";

export type FrontGapSpec = { sideMm: number; centerMm: number; bottomMm: number; topMm: number };

/** Fronts sit flush with the carcass top; the worktop / next unit provides the top reveal. */
export function frontGapSpec(mount: DoorMount): FrontGapSpec {
  return { ...DOOR_GAP[mount], topMm: 0 };
}

/**
 * Same origin as `OpeningFaceRect`: bottom-left of the face (after left filler, above toe kick), mm.
 * `golaGrip` is set when a profile runs along the edge you pull; other gola fronts keep a handle.
 */
export type FrontLeaf = {
  xMm: number; yMm: number; widthMm: number; heightMm: number;
  /** Gola profile replaces the handle on this leaf. */
  golaGrip?: true;
  /** Push-to-open: no handle; latch / tip-on opens the leaf. */
  pushOpen?: true;
  /** Sliding shutter on track plane 0 (rear) or 1 (front); flush pull, no hinges. */
  slidingPlane?: 0 | 1;
  /** Drawer behind sliding shutters: handle-less (finger groove) so the leaves pass in front. */
  behindSliding?: true;
};

/** A gola profile run in face coordinates; `yMm` is the bottom of the band the profile takes from the fronts. */
export type GolaBand = { kind: GolaProfileKind; xMm: number; yMm: number; lengthMm: number; heightMm: number; depthMm: number };

export type ResolvedOpeningFronts = {
  opening: OpeningFaceRect;
  kind: "door" | "drawer";
  leaves: FrontLeaf[];
};

export type ResolvedFronts = {
  mount: DoorMount;
  gaps: FrontGapSpec;
  openings: ResolvedOpeningFronts[];
  profiles: GolaBand[];
};

type Edges = { bottomMm: number; topMm: number; stackMm: number };

function splitRow(xMm: number, yMm: number, spanMm: number, heightMm: number, count: number, gaps: FrontGapSpec): FrontLeaf[] {
  const widthMm = (spanMm - gaps.sideMm * 2 - gaps.centerMm * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => ({
    xMm: xMm + gaps.sideMm + index * (widthMm + gaps.centerMm),
    yMm,
    widthMm,
    heightMm,
  }));
}

/** A single full-face door follows the mount: overlay covers the carcass, inset sits in the face opening. */
function fullFaceDoorRow(config: CabinetConfig, mount: DoorMount, gaps: FrontGapSpec, edges: Edges, count: number, leftFillerMm: number) {
  const { width, height, boardThickness } = config.dimensions;
  const toeKick = config.toeKickHeight;
  if (mount !== "inset") {
    return splitRow(-leftFillerMm, edges.bottomMm, width, height - toeKick - edges.bottomMm - edges.topMm, count, gaps);
  }
  const spec = normalizeConstructionSpec(config.type, config.construction);
  const faceFrame = spec.carcassStyle === "face-frame";
  const stile = faceFrame ? spec.faceFrame.stileWidthMm : boardThickness;
  const rail = faceFrame ? spec.faceFrame.railWidthMm : boardThickness;
  const openingWidth = faceFrame ? Math.max(120, width - stile * 2) : width - boardThickness * 2;
  const openingHeight = Math.max(120, height - toeKick - rail * 2);
  return splitRow(stile - leftFillerMm, rail + edges.bottomMm, openingWidth, openingHeight - edges.bottomMm - edges.topMm, count, gaps);
}

function drawerColumn(opening: OpeningFaceRect, gaps: FrontGapSpec, edges: Edges): FrontLeaf[] {
  const count = Math.max(1, opening.drawerCount);
  const available = opening.heightMm - edges.bottomMm - edges.topMm - (count - 1) * edges.stackMm;
  const ratios = opening.drawerRatios?.length === count
    ? opening.drawerRatios
    : Array.from({ length: count }, () => 1 / count);
  let cursor = opening.yMm + edges.bottomMm;
  return ratios.map((ratio) => {
    const leaf = {
      xMm: opening.xMm + gaps.sideMm,
      yMm: cursor,
      widthMm: opening.widthMm - gaps.sideMm * 2,
      heightMm: available * ratio,
    };
    cursor += leaf.heightMm + edges.stackMm;
    return leaf;
  });
}

const near = (a: number, b: number) => Math.abs(a - b) < 1;

/**
 * The one front-gap rule. Production parts, the 3D model, the legacy cut list
 * and elevations all size doors and drawer fronts from this. A gola front
 * system replaces the edge gaps with the profile band (L on top, C between
 * stacked fronts, the wall profile along the bottom of wall units).
 */
export function resolveFrontGaps(config: CabinetConfig): ResolvedFronts {
  const spec = normalizeConstructionSpec(config.type, config.construction);
  const mount = spec.doorMount;
  const gaps = frontGapSpec(mount);
  const face = layoutCabinetElevationFace(config);
  const gola: GolaProfiles | null = spec.frontSystem?.kind === "gola" ? spec.frontSystem.profiles : null;
  const push = spec.frontSystem?.kind === "push";
  const uses = new Set(gola ? golaProfilesForType(config.type) : []);
  const single = face.openings.length === 1;
  const faceTop = face.faceInsetBottomMm + face.clearHeightMm;
  const openings: ResolvedOpeningFronts[] = [];
  const profiles: GolaBand[] = [];
  const band = (kind: GolaProfileKind, xMm: number, yMm: number, lengthMm: number) =>
    profiles.push({ kind, xMm, yMm, lengthMm, heightMm: gola![kind].heightMm, depthMm: gola![kind].depthMm });
  let topBand = false;
  let bottomBand = false;
  const sliding = spec.sliding ? resolveSlidingFronts(config, face, spec.sliding) : null;
  if (sliding) openings.push(sliding);

  for (const opening of face.openings) {
    const isDoor = opening.contentType === "door" && supportsDoors(config.type) && !sliding;
    const isDrawer = opening.contentType === "drawer-stack" && supportsDrawers(config.type);
    if (!isDoor && !isDrawer) continue;
    const atTop = single || near(opening.yMm + opening.heightMm, faceTop);
    const atBottom = single || near(opening.yMm, face.faceInsetBottomMm);
    const edges: Edges = { bottomMm: gaps.bottomMm, topMm: gaps.topMm, stackMm: gaps.centerMm };
    if (push && APPLY_PUSH_LATCH_BUFFER) {
      const buffer = PUSH_LATCH_BUFFER_MM;
      edges.bottomMm = Math.max(edges.bottomMm, buffer);
      edges.topMm = Math.max(edges.topMm, buffer);
    }
    if (gola) {
      if (atTop && uses.has("L")) { edges.topMm = gola.L.heightMm; topBand = true; }
      if (!atTop && uses.has("C")) edges.topMm = Math.max(0, gola.C.heightMm - gaps.bottomMm);
      if (atBottom && uses.has("wall")) { edges.bottomMm = gola.wall.heightMm; bottomBand = true; }
      if (uses.has("C")) edges.stackMm = gola.C.heightMm;
    }
    if (gola && !atTop && uses.has("C")) band("C", opening.xMm, opening.yMm + opening.heightMm - edges.topMm, opening.widthMm);
    const topGrip = Boolean(gola) && (atTop ? uses.has("L") : uses.has("C"));
    const bottomGrip = Boolean(gola) && atBottom && uses.has("wall");
    const grip = (leaf: FrontLeaf, held: boolean) => {
      if (sliding) return { ...leaf, behindSliding: true as const };
      if (push) return { ...leaf, pushOpen: true as const };
      return held ? { ...leaf, golaGrip: true as const } : leaf;
    };
    // Opt-in latch buffer (APPLY_PUSH_LATCH_BUFFER); off until Ilyas Q3.
    const leafGaps = push && APPLY_PUSH_LATCH_BUFFER
      ? { ...gaps, sideMm: gaps.sideMm + PUSH_LATCH_BUFFER_MM, centerMm: gaps.centerMm + PUSH_LATCH_BUFFER_MM }
      : gaps;
    if (isDoor) {
      const count = opening.doorStyle === "single" ? 1 : 2;
      const leaves = single
        ? fullFaceDoorRow(config, mount, leafGaps, edges, count, face.leftFillerMm)
        : splitRow(opening.xMm, opening.yMm + edges.bottomMm, opening.widthMm, opening.heightMm - edges.bottomMm - edges.topMm, count, leafGaps);
      openings.push({ opening, kind: "door", leaves: leaves.map((leaf) => grip(leaf, topGrip || bottomGrip)) });
    } else {
      const leaves = drawerColumn(opening, leafGaps, edges);
      if (gola && uses.has("C")) leaves.slice(0, -1).forEach((leaf) => band("C", opening.xMm, leaf.yMm + leaf.heightMm, opening.widthMm));
      const last = leaves.length - 1;
      const held = (index: number) => (index === last ? topGrip : Boolean(gola) && uses.has("C")) || (index === 0 && bottomGrip);
      openings.push({ opening, kind: "drawer", leaves: leaves.map((leaf, index) => grip(leaf, held(index))) });
    }
  }
  if (topBand) band("L", -face.leftFillerMm, face.faceHeightMm - gola!.L.heightMm, config.dimensions.width);
  if (bottomBand) band("wall", -face.leftFillerMm, 0, config.dimensions.width);
  return { mount, gaps, openings, profiles };
}

/** No protruding handle: gola grip, push-open, sliding leaf (flush pull) or a drawer behind sliding shutters. */
export function isHandleFreeLeaf(leaf: FrontLeaf): boolean {
  return Boolean(leaf.golaGrip || leaf.pushOpen || leaf.behindSliding) || leaf.slidingPlane !== undefined;
}

/** Fronts that still need a handle: every front when handled, ungripped fronts under gola; never push or sliding. */
export function handledFrontCount(fronts: ResolvedFronts): number {
  return fronts.openings.reduce((sum, entry) => sum + entry.leaves.filter((leaf) => !isHandleFreeLeaf(leaf)).length, 0);
}

/** Door + drawer leaves opened by a push latch / tip-on (one mechanism per leaf). */
export function pushFrontCount(fronts: ResolvedFronts): number {
  return fronts.openings.reduce(
    (sum, entry) => sum + entry.leaves.filter((leaf) => leaf.pushOpen).length,
    0,
  );
}
