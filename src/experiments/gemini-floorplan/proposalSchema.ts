import type {
  GeminiFloorProposal,
  OpeningKind,
  ProposalPoint,
  ProposalUnits,
  ScaleConfidence,
} from "./proposalTypes";

const UNITS: ProposalUnits[] = ["mm", "cm", "m", "ft", "in"];
const CONF: ScaleConfidence[] = ["low", "medium", "high"];
const KINDS: OpeningKind[] = ["door", "window", "opening"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function parsePoint(v: unknown, path: string, errors: string[]): ProposalPoint | null {
  if (!isRecord(v)) {
    errors.push(`${path} must be an object`);
    return null;
  }
  const x = asNumber(v.x);
  const y = asNumber(v.y);
  if (x === undefined || y === undefined) {
    errors.push(`${path} needs numeric x,y`);
    return null;
  }
  return { x, y };
}

/** Validates unknown JSON into a proposal; does not convert units. */
export function parseGeminiFloorProposal(raw: unknown): {
  proposal: GeminiFloorProposal | null;
  errors: string[];
} {
  const errors: string[] = [];
  if (!isRecord(raw)) {
    return { proposal: null, errors: ["Root must be a JSON object"] };
  }

  const units = asString(raw.units) as ProposalUnits | undefined;
  if (!units || !UNITS.includes(units)) {
    errors.push(`units must be one of ${UNITS.join(", ")}`);
  }

  const scaleConfidence = asString(raw.scaleConfidence) as ScaleConfidence | undefined;
  if (!scaleConfidence || !CONF.includes(scaleConfidence)) {
    errors.push(`scaleConfidence must be one of ${CONF.join(", ")}`);
  }

  const assumedWallHeightMm = asNumber(raw.assumedWallHeightMm);
  if (assumedWallHeightMm === undefined || assumedWallHeightMm <= 0) {
    errors.push("assumedWallHeightMm must be a positive number");
  }

  if (!Array.isArray(raw.rooms) || raw.rooms.length === 0) {
    errors.push("rooms must be a non-empty array");
  }
  if (!Array.isArray(raw.walls) || raw.walls.length === 0) {
    errors.push("walls must be a non-empty array");
  }

  const rooms: GeminiFloorProposal["rooms"] = [];
  if (Array.isArray(raw.rooms)) {
    raw.rooms.forEach((room, i) => {
      if (!isRecord(room)) {
        errors.push(`rooms[${i}] must be an object`);
        return;
      }
      const id = asString(room.id) ?? `room-${i + 1}`;
      const name = asString(room.name);
      const outlineSrc = room.outlineMm ?? room.outline;
      if (!Array.isArray(outlineSrc) || outlineSrc.length < 3) {
        errors.push(`rooms[${i}].outlineMm needs ≥3 points`);
        return;
      }
      const outlineMm: ProposalPoint[] = [];
      outlineSrc.forEach((pt, j) => {
        const p = parsePoint(pt, `rooms[${i}].outlineMm[${j}]`, errors);
        if (p) outlineMm.push(p);
      });
      if (outlineMm.length >= 3) rooms.push({ id, name, outlineMm });
    });
  }

  const walls: GeminiFloorProposal["walls"] = [];
  if (Array.isArray(raw.walls)) {
    raw.walls.forEach((wall, i) => {
      if (!isRecord(wall)) {
        errors.push(`walls[${i}] must be an object`);
        return;
      }
      const id = asString(wall.id) ?? `wall-${i + 1}`;
      const a = parsePoint(wall.a, `walls[${i}].a`, errors);
      const b = parsePoint(wall.b, `walls[${i}].b`, errors);
      const thicknessMm = asNumber(wall.thicknessMm);
      if (a && b) walls.push({ id, a, b, thicknessMm });
    });
  }

  const openings: GeminiFloorProposal["openings"] = [];
  if (raw.openings !== undefined) {
    if (!Array.isArray(raw.openings)) {
      errors.push("openings must be an array when present");
    } else {
      raw.openings.forEach((op, i) => {
        if (!isRecord(op)) {
          errors.push(`openings[${i}] must be an object`);
          return;
        }
        const kind = asString(op.kind) as OpeningKind | undefined;
        if (!kind || !KINDS.includes(kind)) {
          errors.push(`openings[${i}].kind must be door|window|opening`);
          return;
        }
        openings.push({
          id: asString(op.id) ?? `opening-${i + 1}`,
          kind,
          wallId: asString(op.wallId),
          widthMm: asNumber(op.widthMm),
          heightMm: asNumber(op.heightMm),
        });
      });
    }
  }

  const notes = Array.isArray(raw.notes)
    ? raw.notes.filter((n): n is string => typeof n === "string")
    : undefined;

  if (errors.length || !units || !scaleConfidence || assumedWallHeightMm === undefined) {
    return { proposal: null, errors };
  }
  if (rooms.length === 0 || walls.length === 0) {
    errors.push("Parsed rooms/walls were empty after validation");
    return { proposal: null, errors };
  }

  return {
    proposal: {
      units,
      scaleConfidence,
      assumedWallHeightMm,
      rooms,
      walls,
      openings: openings.length ? openings : undefined,
      notes,
    },
    errors: [],
  };
}
