import { describe, expect, it } from "vitest";
import { GOLDEN_RUN_OBJECT_IDS } from "../livingRoom/goldenRun/types";
import { applianceHostCandidates, placeApplianceInCabinet } from "./commands";
import { findObject as find, mapObject, SINK_ID, sinkObject, withSink } from "./hostedAppliances.testHelpers";
import { isPlaceableAppliance, readApplianceHost } from "./parameters";
import { syncHostedAppliances } from "./sync";

const { baseA, drawer } = GOLDEN_RUN_OBJECT_IDS;

/** What `commitDocument` does: the edit, then the sync against the pre-edit project. */
const commit = (before: ReturnType<typeof withSink>, edited: ReturnType<typeof withSink>) => syncHostedAppliances(edited, before);
const nudgeSink = (project: ReturnType<typeof withSink>, dx: number, dz: number) => mapObject(project, SINK_ID, (object) =>
  ({ ...object, position: { ...object.position, x: object.position.x + dx, z: object.position.z + dz } }));

describe("editing a placed appliance", () => {
  it("a drag or typed X / Z becomes an offset in the cabinet and survives moving the cabinet", () => {
    const placed = placeApplianceInCabinet(withSink(), SINK_ID, baseA, "sink-bowl");
    const start = find(placed, SINK_ID).position;
    const dragged = commit(placed, nudgeSink(placed, 30, 0));
    expect(find(dragged, SINK_ID).position.x).toBeCloseTo(start.x + 30, 1);
    expect(find(dragged, SINK_ID).position.z).toBeCloseTo(start.z, 1);

    const hostMoved = commit(dragged, mapObject(dragged, baseA, (object) =>
      ({ ...object, position: { ...object.position, x: object.position.x + 600 } })));
    expect(find(hostMoved, SINK_ID).position.x).toBeCloseTo(start.x + 630, 1);
  });

  it("offsets are clamped so the cut-out stays inside the cabinet", () => {
    const placed = placeApplianceInCabinet(withSink(), SINK_ID, baseA, "sink-bowl");
    const host = find(placed, baseA);
    const dragged = commit(placed, nudgeSink(placed, 5000, 5000));
    const mount = readApplianceHost(find(dragged, SINK_ID))!;
    expect(Math.abs(mount.offsetAlongMm)).toBe(Math.round((host.dimensions.widthMm - mount.cutoutWidthMm) / 2));
    expect(Math.abs(mount.offsetDepthMm)).toBe(Math.round(Math.max(0, (host.dimensions.depthMm - mount.cutoutDepthMm) / 2)));
  });

  it("R on the appliance keeps a quarter turn on top of the cabinet's rotation", () => {
    const placed = placeApplianceInCabinet(withSink(), SINK_ID, baseA, "sink-bowl");
    const hostY = find(placed, baseA).rotation.y;
    const turned = commit(placed, mapObject(placed, SINK_ID, (object) => ({ ...object, rotation: { ...object.rotation, y: object.rotation.y + 90 } })));
    expect(readApplianceHost(find(turned, SINK_ID))!.rotationOffsetDeg).toBe(90);
    const hostTurned = commit(turned, mapObject(turned, baseA, (object) => ({ ...object, rotation: { ...object.rotation, y: hostY + 90 } })));
    expect(find(hostTurned, SINK_ID).rotation.y).toBe((hostY + 180) % 360);
  });

  it("a cabinet that already holds an appliance is not offered to a second one", () => {
    const placed = placeApplianceInCabinet(withSink(), SINK_ID, baseA, "sink-bowl");
    const hob = sinkObject(placed.activeRoomId!, { id: "test-hob", name: "Induction hob" });
    const project = { ...placed, objects: [...placed.objects, hob] };
    const forHob = applianceHostCandidates(project, hob).map((object) => object.id);
    expect(forHob).not.toContain(baseA);
    expect(forHob).toContain(drawer);
    expect(applianceHostCandidates(project, find(project, SINK_ID)).map((object) => object.id)).toContain(baseA);
  });

  it("only kitchen / appliance items and imported models can be placed", () => {
    const roomId = withSink().activeRoomId!;
    expect(isPlaceableAppliance(sinkObject(roomId))).toBe(true);
    expect(isPlaceableAppliance(sinkObject(roomId, { category: "seating", name: "Sofa" }))).toBe(false);
    expect(isPlaceableAppliance(sinkObject(roomId, { category: "imported", kind: "custom", extensions: { assetImport: { id: "a" } } }))).toBe(true);
  });
});
