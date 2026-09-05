/** Phase 7+ architectural scene model (product geometry after review). */

export type ArchPoint = { x: number; y: number };

export type WallKind = "exterior" | "interior" | "partition" | "unknown";

export type JunctionKind = "corner" | "T" | "X" | "end" | "unknown";

export type WallJunction = {
  id: string;
  point: ArchPoint;
  kind: JunctionKind;
  wallIds: string[];
};

export type ArchitecturalWall = {
  id: string;
  start: ArchPoint;
  end: ArchPoint;
  thicknessMm: number;
  heightMm: number;
  type: WallKind;
  roomLeft?: string;
  roomRight?: string;
  openingIds: string[];
  junctionStartId?: string;
  junctionEndId?: string;
  confidence: "low" | "medium" | "high";
};

export type ArchitecturalOpening = {
  id: string;
  kind: "door" | "window" | "opening";
  wallId: string;
  /** Offset along wall from start (0–1). */
  t: number;
  widthMm: number;
  heightMm: number;
  sillMm: number;
  swing?: "left" | "right" | "unknown";
};

export type ArchRoom = {
  id: string;
  name?: string;
  outlineMm: ArchPoint[];
  adjacentRoomIds: string[];
  floorHeightMm: number;
  ceilingHeightMm: number;
};

export type FloorSurface = { id: string; roomId: string; outlineMm: ArchPoint[] };
export type CeilingSurface = { id: string; roomId: string; outlineMm: ArchPoint[]; heightMm: number };

export type ArchFixture = {
  id: string;
  type: string;
  roomId?: string;
  anchorMm: ArchPoint;
  confidence: "low" | "medium" | "high";
  source: "vision" | "manual" | "inferred";
};

export type ArchitecturalScene = {
  units: "mm";
  walls: ArchitecturalWall[];
  wallJunctions: WallJunction[];
  openings: ArchitecturalOpening[];
  rooms: ArchRoom[];
  floors: FloorSurface[];
  ceilings: CeilingSurface[];
  fixtures: ArchFixture[];
  notes: string[];
};
