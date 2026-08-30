import { describe, expect, it } from "vitest";
import {
  adaptHandoffProject,
  commitEngineeringHandoff,
  readHandoffRecord,
  syncInteriorDocumentFromCabinets,
} from ".";
import { asLivingRoomDocument, createApprovedHandoffProject } from "./handoff.testHelpers";

const NOW = "2026-08-30T12:00:00.000Z";

describe("engineering interiors sync", () => {
  it("writes live cabinet placement back into the canonical interiors document", () => {
    const handed = commitEngineeringHandoff(
      asLivingRoomDocument(createApprovedHandoffProject(NOW)),
      [],
      NOW,
    );
    const adapted = adaptHandoffProject(handed);
    const first = adapted.project.cabinets[0]!;
    const movedX = first.placement.x + 250;
    const movedWidth = first.config.dimensions.width + 80;
    const engineered = {
      ...adapted.project,
      cabinets: adapted.project.cabinets.map((cabinet) =>
        cabinet.id === first.id
          ? {
              ...cabinet,
              placement: { ...cabinet.placement, x: movedX },
              config: {
                ...cabinet.config,
                dimensions: { ...cabinet.config.dimensions, width: movedWidth },
              },
            }
          : cabinet,
      ),
      interiorDocument: handed,
    };
    const synced = syncInteriorDocumentFromCabinets(engineered, adapted.room, NOW);
    const object = synced.interiorDocument?.objects.find(
      (item) => item.id === first.interiorObjectId || item.id === first.id,
    );
    expect(object?.position.x).toBe(movedX);
    expect(object?.dimensions.widthMm).toBe(movedWidth);
    expect(synced.interiorDocument?.rooms.some((room) => room.roomType === "living-room")).toBe(true);
    expect(readHandoffRecord(synced.interiorDocument)?.revision).toBe(readHandoffRecord(handed)?.revision);

    const reopened = adaptHandoffProject(synced.interiorDocument!);
    const live = reopened.project.cabinets.find((cabinet) => cabinet.id === first.id);
    expect(live?.placement.x).toBe(movedX);
    expect(live?.config.dimensions.width).toBe(movedWidth);
  });
});
