import { describe, expect, it } from "vitest";
import { createGoldenCabinetInstance } from "../cabinetIdentity";
import { interiorProjectFromCabinetProject } from "../interiorProject";
import { DEFAULT_ROOM } from "../roomModel";
import { DEFAULT_COUNTERTOP_OVERHANG_FRONT_MM } from "../cabinetRuns";
import {
  compileCabinetRunExtras,
  countertopTouchesCabinet,
} from "./cabinetSceneRunExtras";
import { compileLivingRoomScene } from "./sceneCompiler";
import { createGoldenCabinetSceneProject, goldenSceneNode } from "./goldenCabinetScene";

const NOW = "2026-08-30T08:00:00.000Z";

function sideWallProject() {
  const a = createGoldenCabinetInstance("frameless-standard-base", "side-a");
  const b = createGoldenCabinetInstance("frameless-standard-base", "side-b");
  return interiorProjectFromCabinetProject({
    project: {
      version: 1,
      cabinets: [
        { ...a, placement: { ...a.placement, x: -1720, z: -450, rotation: 90, attachment: "left-wall" } },
        { ...b, placement: { ...b.placement, x: -1720, z: 450, rotation: 90, attachment: "left-wall" } },
      ],
    },
    activeRoom: DEFAULT_ROOM,
    now: NOW,
  });
}

describe("cabinet scene run extras", () => {
  it("orients side-wall countertops along the Z run", () => {
    const project = sideWallProject();
    const nodes = compileCabinetRunExtras(project);
    const top = nodes.find((node) => node.metadata.role === "countertop");
    const lineX = Math.min(
      ...project.objects.filter((object) => object.kind === "cabinet").map((object) => object.position.x),
    );
    expect(top?.metadata.axis).toBe("z");
    expect(top?.primitives[0]?.kind).toBe("box");
    if (top?.primitives[0]?.kind !== "box") return;
    expect(top.primitives[0].sizeMm.depth).toBeGreaterThan(top.primitives[0].sizeMm.width);
    expect(top.positionMm.x).toBe(lineX + DEFAULT_COUNTERTOP_OVERHANG_FRONT_MM / 2);
  });

  it("drops countertops when their cabinets are hidden", () => {
    const project = createGoldenCabinetSceneProject();
    const baseId = goldenSceneNode(project, "frameless-standard-base").sourceObjectId!;
    expect(countertopTouchesCabinet(compileLivingRoomScene(project).nodes, baseId)).toBe(true);
    const hidden = {
      ...project,
      objects: project.objects.map((object) => (
        object.id === baseId
          ? { ...object, extensions: { ...object.extensions, layerVisible: false } }
          : object
      )),
    };
    const scene = compileLivingRoomScene(hidden);
    expect(scene.nodes.some((node) => node.sourceObjectId === baseId)).toBe(false);
    expect(countertopTouchesCabinet(scene.nodes, baseId)).toBe(false);
  });
});
