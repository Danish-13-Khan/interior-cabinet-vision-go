import { describe, expect, it } from "vitest";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
} from "../interiorProject";
import {
  compileLivingRoomScene,
  computeArchitectureBounds,
  createLivingRoomStarterProject,
  moveLivingRoomObject,
  resizeLivingRoomObject,
  rotateLivingRoomObject,
  resolveWindowKeyLights,
} from ".";

const NOW = "2026-08-11T20:00:00.000Z";

describe("living-room scene compiler", () => {
  it("compiles every starter object through a procedural adapter", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const scene = compileLivingRoomScene(project);
    const objectNodes = scene.nodes.filter((node) => node.sourceObjectId);

    expect(objectNodes).toHaveLength(15);
    expect(objectNodes.every((node) => !node.placeholder)).toBe(true);
    expect(objectNodes.every((node) => node.primitives.length > 0)).toBe(true);
    expect(scene.warnings).toEqual([]);
    expect(scene.windowOpenings.length).toBeGreaterThan(0);
    expect(scene.materials.some((material) => material.kind === "glass")).toBe(true);
    const featureWall = objectNodes.find(
      (node) => node.metadata.catalogItemId === "living:feature-wall-fluted",
    )!;
    expect(featureWall.primitives.filter((primitive) => primitive.id.startsWith("slat-")).length)
      .toBeGreaterThan(20);
    const displayNiche = objectNodes.find(
      (node) => node.metadata.catalogItemId === "living:display-niche",
    )!;
    expect(displayNiche.primitives.some((primitive) => primitive.id === "back")).toBe(true);
    const fan = objectNodes.find(
      (node) => node.metadata.catalogItemId === "living:ceiling-fan",
    )!;
    expect(fan.primitives.filter((primitive) => primitive.id.startsWith("blade-")).length).toBe(4);
    expect(
      objectNodes
        .filter((node) => node.metadata.category === "sofa" || node.metadata.category === "chair")
        .every((node) => node.primitives.some((primitive) => primitive.kind === "rounded-box")),
    ).toBe(true);
  });

  it("cuts wall geometry around doors and windows", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const scene = compileLivingRoomScene(project);
    const wallNodes = scene.nodes.filter((node) => node.metadata.role === "wall");
    const openingNodes = scene.nodes.filter((node) => node.metadata.role === "opening");

    expect(wallNodes.filter((node) => node.metadata.wallSide === "front")).toHaveLength(3);
    expect(wallNodes.filter((node) => node.metadata.wallSide === "left")).toHaveLength(4);
    expect(openingNodes.map((node) => node.metadata.openingKind).sort()).toEqual(["door", "window"]);
  });

  it("updates transforms immediately while retaining reusable geometry keys", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const sofa = project.objects.find((object) => object.category === "sofa")!;
    const initial = compileLivingRoomScene(project);
    const movedProject = moveLivingRoomObject(project, sofa.id, {
      ...sofa.position,
      x: sofa.position.x + 250,
    });
    const moved = compileLivingRoomScene(movedProject);
    const initialNode = initial.nodes.find((node) => node.sourceObjectId === sofa.id)!;
    const movedNode = moved.nodes.find((node) => node.sourceObjectId === sofa.id)!;

    expect(movedNode.positionMm.x).toBe(initialNode.positionMm.x + 250);
    expect(movedNode.primitives.map((part) => part.geometryKey)).toEqual(
      initialNode.primitives.map((part) => part.geometryKey),
    );
    expect(moved.fingerprint).not.toBe(initial.fingerprint);
  });

  it("recompiles resized object geometry with new cache keys", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const table = project.objects.find((object) => object.catalogItemId === "living:coffee-table")!;
    const initial = compileLivingRoomScene(project);
    const resized = compileLivingRoomScene(resizeLivingRoomObject(project, table.id, {
      ...table.dimensions,
      widthMm: table.dimensions.widthMm + 300,
    }));
    const beforeKeys = initial.nodes.find((node) => node.sourceObjectId === table.id)!.primitives.map((part) => part.geometryKey);
    const afterKeys = resized.nodes.find((node) => node.sourceObjectId === table.id)!.primitives.map((part) => part.geometryKey);

    expect(afterKeys).not.toEqual(beforeKeys);
  });

  it("uses a safe placeholder for future catalog objects", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const future = {
      ...project.objects[0]!,
      id: "future-object",
      name: "Future Object",
      catalogItemId: "future:unregistered-object",
    };
    const scene = compileLivingRoomScene({ ...project, objects: [...project.objects, future] });
    const node = scene.nodes.find((candidate) => candidate.sourceObjectId === future.id)!;

    expect(node.adapterId).toBe("safe-placeholder-v1");
    expect(node.placeholder).toBe(true);
    expect(scene.warnings[0]).toContain("Future Object");
  });

  it("produces the same compiled scene after canonical save and reopen", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const before = compileLivingRoomScene(project);
    const serialized = serializeInteriorProjectFile(project, NOW);
    const loaded = loadInteriorProjectFile(serialized);
    const after = compileLivingRoomScene(loaded.document);

    expect(after.fingerprint).toBe(before.fingerprint);
    expect(after.nodes).toEqual(before.nodes);
    expect(after.bounds).toEqual(before.bounds);
  });

  it("keeps architecture bounds and window lights stable when millwork rotates", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const tv = project.objects.find((object) => object.catalogItemId === "living:tv-unit")!;
    const before = compileLivingRoomScene(project);
    const after = compileLivingRoomScene(rotateLivingRoomObject(project, tv.id, tv.rotation.y + 90));
    expect(computeArchitectureBounds(after.nodes).center).toEqual(
      computeArchitectureBounds(before.nodes).center,
    );
    expect(after.windowOpenings.map((opening) => opening.centerMm)).toEqual(
      before.windowOpenings.map((opening) => opening.centerMm),
    );
    const recipeId = project.renderSettings.lightingRecipeId;
    const beforeKey = resolveWindowKeyLights({
      openings: before.windowOpenings,
      roomCenterMm: computeArchitectureBounds(before.nodes).center,
      recipeId,
      mode: "preview",
      quality: "draft",
    })[0];
    const afterKey = resolveWindowKeyLights({
      openings: after.windowOpenings,
      roomCenterMm: computeArchitectureBounds(after.nodes).center,
      recipeId,
      mode: "preview",
      quality: "draft",
    })[0];
    expect(afterKey?.targetMm).toEqual(beforeKey?.targetMm);
  });
});
