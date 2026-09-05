import type { GeminiFloorProposal } from "../proposalTypes";
import type { ArchFixture, ArchitecturalScene } from "./archSceneTypes";

const ROOM_TYPES = [
  "kitchen",
  "bedroom",
  "bathroom",
  "living",
  "corridor",
  "utility",
  "balcony",
] as const;

/** Phase 10: lightweight semantic fixtures from room names / notes (no auto-accept). */
export function extractSemanticFixtures(
  proposal: GeminiFloorProposal,
  scene: ArchitecturalScene,
): ArchFixture[] {
  const fixtures: ArchFixture[] = [];
  let i = 0;
  for (const room of scene.rooms) {
    const name = (room.name ?? room.id).toLowerCase();
    const matched = ROOM_TYPES.find((t) => name.includes(t));
    if (!matched) continue;
    const cx =
      room.outlineMm.reduce((s, p) => s + p.x, 0) / Math.max(room.outlineMm.length, 1);
    const cy =
      room.outlineMm.reduce((s, p) => s + p.y, 0) / Math.max(room.outlineMm.length, 1);
    i += 1;
    fixtures.push({
      id: `fix-${i}`,
      type: `room:${matched}`,
      roomId: room.id,
      anchorMm: { x: cx, y: cy },
      confidence: "medium",
      source: "inferred",
    });
  }
  for (const note of proposal.notes ?? []) {
    const lower = note.toLowerCase();
    if (lower.includes("sink") || lower.includes("hob") || lower.includes("fridge")) {
      i += 1;
      fixtures.push({
        id: `fix-note-${i}`,
        type: lower.includes("sink")
          ? "fixture:sink"
          : lower.includes("hob")
            ? "fixture:hob"
            : "fixture:refrigerator",
        anchorMm: { x: 0, y: 0 },
        confidence: "low",
        source: "vision",
      });
    }
  }
  return fixtures;
}
