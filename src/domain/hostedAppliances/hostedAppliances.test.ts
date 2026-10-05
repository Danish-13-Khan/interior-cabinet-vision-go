import { describe, expect, it } from "vitest";
import { createCabinetConstruction } from "../cabinetConstruction/createConstruction";
import { buildHardwareLines, createHardwareSchedule, normalizeCabinetHardware } from "../hardwareSystem";
import { DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { cabinetProjectFromInteriorProject } from "../interiorProject";
import { readGoldenRunCountertop } from "../livingRoom/goldenRun/countertops";
import { GOLDEN_RUN_OBJECT_IDS } from "../livingRoom/goldenRun/types";
import { INSERT_HOSTED_BY, OFFSET_ALONG_MM } from "./parameters";
import { applianceHostCandidates, placeApplianceInCabinet, releaseAppliance } from "./commands";
import { findObject as find, mapObject, SINK_ID, withSink } from "./hostedAppliances.testHelpers";
import { syncHostedAppliances } from "./sync";

const { baseA, drawer, tall } = GOLDEN_RUN_OBJECT_IDS;

describe("hosted appliances", () => {
  it("offers worktop-height cabinets only", () => {
    const project = withSink();
    const ids = applianceHostCandidates(project, find(project, SINK_ID)).map((object) => object.id);
    expect(ids).toContain(baseA);
    expect(ids).not.toContain(tall);
  });

  it("centres on the host and sits on the run's worktop top surface", () => {
    const placed = placeApplianceInCabinet(withSink(), SINK_ID, baseA, "sink-bowl");
    const host = find(placed, baseA);
    const sink = find(placed, SINK_ID);
    const top = readGoldenRunCountertop(placed);
    expect(sink.position.x).toBeCloseTo(host.position.x, 1);
    expect(sink.position.z).toBeCloseTo(host.position.z, 1);
    expect(sink.position.y).toBeCloseTo(top.positionY + top.thicknessMm, 1);
    expect(sink.rotation.y).toBe(host.rotation.y);
  });

  it("moving the host carries the sink in the same commit", () => {
    const placed = placeApplianceInCabinet(withSink(), SINK_ID, baseA, "sink-bowl");
    const before = find(placed, SINK_ID).position;
    const moved = syncHostedAppliances(mapObject(placed, baseA, (object) =>
      ({ ...object, position: { ...object.position, x: object.position.x + 600 } })));
    expect(find(moved, SINK_ID).position.x).toBeCloseTo(before.x + 600, 1);
    expect(find(moved, SINK_ID).position.z).toBeCloseTo(before.z, 1);
  });

  it("rotating the host turns the sink and its offset with it", () => {
    let project = placeApplianceInCabinet(withSink(), SINK_ID, baseA, "sink-bowl");
    project = mapObject(project, SINK_ID, (object) => ({ ...object, parameters: { ...object.parameters, [OFFSET_ALONG_MM]: 50 } }));
    project = syncHostedAppliances(mapObject(project, baseA, (object) => ({ ...object, rotation: { ...object.rotation, y: 90 } })));
    const host = find(project, baseA);
    const sink = find(project, SINK_ID);
    expect(sink.rotation.y).toBe(90);
    expect(sink.position.x).toBeCloseTo(host.position.x, 1);
    expect(sink.position.z).toBeCloseTo(host.position.z - 50, 1);
  });

  it("deleting the host detaches the sink where it was, with the host-removed flag", () => {
    const placed = placeApplianceInCabinet(withSink(), SINK_ID, baseA, "sink-bowl");
    const before = find(placed, SINK_ID).position;
    const deleted = syncHostedAppliances({ ...placed, objects: placed.objects.filter((object) => object.id !== baseA) });
    const sink = find(deleted, SINK_ID);
    expect(sink.position).toEqual(before);
    expect(sink.parameters.hostCabinetId).toBeUndefined();
    expect(sink.parameters.hostRemoved).toBe(true);
  });

  it("writes insertKind on the host object so it survives the config rebuild, and release clears it", () => {
    const placed = placeApplianceInCabinet(withSink(), SINK_ID, drawer, "sink-bowl");
    expect(find(placed, drawer).parameters).toMatchObject({ insertKind: "sink-bowl", [INSERT_HOSTED_BY]: SINK_ID, applianceWidthMm: 760 });
    const cabinet = cabinetProjectFromInteriorProject(placed).project.cabinets.find((item) => item.interiorObjectId === drawer)!;
    expect(normalizeCabinetHardware(cabinet.config.type, cabinet.config.hardware).insertKind).toBe("sink-bowl");
    const lines = buildHardwareLines(cabinet, createCabinetConstruction(cabinet.config), DEFAULT_COSTING_SETTINGS);
    expect(lines.some((line) => line.kind === "slide")).toBe(false);
    const [summary] = createHardwareSchedule([cabinet], new Map([[cabinet.id, lines]])).byCabinet;
    expect(summary!.notes.join(" ")).toContain("Worktop cut-out for the sink: 760 × 480 mm");

    const released = releaseAppliance(placed, SINK_ID);
    expect(find(released, drawer).parameters.insertKind).toBeUndefined();
    const restored = cabinetProjectFromInteriorProject(released).project.cabinets.find((item) => item.interiorObjectId === drawer)!;
    const restoredLines = buildHardwareLines(restored, createCabinetConstruction(restored.config), DEFAULT_COSTING_SETTINGS);
    expect(restoredLines.some((line) => line.kind === "slide")).toBe(true);
  });
});
