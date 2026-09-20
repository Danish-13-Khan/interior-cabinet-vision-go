export type PointM = [number, number];

export type ExtractOpening = {
  /** Optional — Apply uses kind defaults when omitted. */
  sill_m?: number;
  /** Optional — Apply uses kind defaults when omitted. Never coerce missing → 0. */
  height_m?: number;
  swing?: string | null;
  wall_height_m?: number;
};

export type ExtractPolygon = {
  id?: string;
  label?: string;
  confidence?: number | null;
  outer: PointM[];
  holes?: PointM[][];
  material_id?: string;
  opening?: ExtractOpening;
};

/** Human scale trust. `pixel_scale` alone is never millwork-trusted. */
export type ScaleTrustStatus = "unknown" | "assumed" | "calibrated";

export type ExtractScaleTrust = {
  status: ScaleTrustStatus;
  source?: string;
  referenceLengthMm?: number;
};

export type ExtractionResult = {
  schema_version: string;
  units: "meters" | "centimeters";
  pixel_scale?: number | null;
  /** Additive. Missing → treat as unknown (do not infer from pixel_scale). */
  scale?: ExtractScaleTrust;
  image_size?: { width: number; height: number };
  source?: {
    filename?: string;
    content_type?: string;
    mode?: string;
    quality?: string;
    notes?: string;
  };
  polygons: {
    rooms: ExtractPolygon[];
    walls: ExtractPolygon[];
    doors: ExtractPolygon[];
    windows: ExtractPolygon[];
    stairs?: ExtractPolygon[];
  };
  defaults?: { wall_height_m?: number; materials?: Record<string, string> };
  furniture_anchors?: unknown[];
};

export type WallGraphNode = { id: number; x: number; y: number };
export type WallGraphEdge = {
  id: number;
  a: number;
  b: number;
  thickM: number;
  lengthM: number;
  role: "exterior" | "interior" | "dropped";
  sourceId: string;
  /** True when thickness was raised to the 150 mm floor. */
  thickened: boolean;
  /** True when AABB flattened a non axis-aligned footprint. */
  diagonalCollapsed: boolean;
};

export type WallGraph = { nodes: WallGraphNode[]; edges: WallGraphEdge[]; snap: number };

export type OpeningAttachment =
  | { status: "matched"; wallSourceId: string; offsetM: number; widthM: number; trimmed: boolean }
  | { status: "ambiguous" | "unmatched"; reason: string };

export type DirectedWallUseM = {
  wallSourceId: string;
  direction: "forward" | "reverse";
};

export type RoomLoopMatch =
  | { status: "matched"; wallUses: DirectedWallUseM[]; holeMatches: RoomLoopMatch[] }
  | { status: "unmatched"; reason: string };

export type NormalizeIssue = {
  code:
    | "diagonal_wall"
    | "thin_wall"
    | "dropped_edge"
    | "unmatched_room"
    | "unmatched_hole"
    | "ambiguous_opening"
    | "unmatched_opening";
  message: string;
  entityId?: string;
  blocksApply: boolean;
};

export type NormalizedFloorplan = {
  draft: ExtractionResult;
  graph: WallGraph;
  roomMatches: Record<string, RoomLoopMatch>;
  openingAttachments: Record<string, OpeningAttachment>;
  issues: NormalizeIssue[];
  canApply: boolean;
};
