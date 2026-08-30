import { describe, expect, it } from "vitest";
import { GOLDEN_CABINET_FAMILY_IDS } from "../cabinetIdentity";
import { compileBookcase } from "./sceneAdaptersMillwork";
import { compileLivingRoomObjectNode } from "./sceneAdapters";
import {
  createGoldenCabinetSceneProject,
  goldenPrimitiveRoles,
  goldenSceneNode,
} from "./goldenCabinetScene";
import { countertopTouchesCabinet } from "./cabinetSceneRunExtras";
import { compileLivingRoomScene } from "./sceneCompiler";
import {
  compiledNodeLabelText,
  compiledNodeLabelVisible,
} from "./compiledNodeLabel";
import { buildPreExportChecklist } from "./clientPresentation/preExportChecklist";

describe("golden cabinet scene fixtures", () => {
  it("compiles every golden family with shared geometry, not a bookcase stand-in", () => {
    const project = createGoldenCabinetSceneProject();
    const scene = compileLivingRoomScene(project);
    const signatures = GOLDEN_CABINET_FAMILY_IDS.map((familyId) => {
      const node = goldenSceneNode(project, familyId);
      const object = project.objects.find((item) => item.id === node.sourceObjectId)!;
      const bookcaseIds = compileBookcase(object).map((part) => part.id).sort().join(",");
      const compiledIds = node.primitives.map((part) => part.id).sort().join(",");
      expect(node.adapterId).not.toBe("bookcase-v1");
      expect(node.metadata.geometry).toBe("shared-cabinet");
      expect(compiledIds).not.toBe(bookcaseIds);
      expect(goldenPrimitiveRoles(node).has("fronts")).toBe(true);
      return { familyId, roles: [...goldenPrimitiveRoles(node)].sort(), height: object.dimensions.heightMm };
    });
    const wall = goldenSceneNode(project, "frameless-standard-wall");
    const drawer = goldenSceneNode(project, "frameless-standard-drawer");
    const base = goldenSceneNode(project, "frameless-standard-base");
    const tall = goldenSceneNode(project, "frameless-standard-tall");
    expect(wall.positionMm.y).toBe(1400);
    expect(goldenPrimitiveRoles(wall).has("toe-kick")).toBe(false);
    expect(goldenPrimitiveRoles(base).has("toe-kick")).toBe(true);
    expect(drawer.primitives.some((part) => part.id.includes("drawer"))).toBe(true);
    expect(tall.primitives.some((part) => part.id.includes("end-panel"))).toBe(true);
    expect(new Set(signatures.map((item) => item.roles.join("|"))).size).toBeGreaterThan(1);
    expect(countertopTouchesCabinet(scene.nodes, tall.sourceObjectId!)).toBe(false);
    expect(countertopTouchesCabinet(scene.nodes, base.sourceObjectId!)).toBe(true);
  });

  it("hides fallback labels in client/hero views and blocks proposal export", () => {
    const fallback = {
      id: "n1",
      name: "Base 900",
      sourceObjectId: "golden-base",
      adapterId: "base-cabinet-v1",
      positionMm: { x: 0, y: 0, z: 0 },
      rotationDegrees: { x: 0, y: 0, z: 0 },
      primitives: [],
      placeholder: true,
      metadata: { geometryFallback: true },
      renderBinding: { strategy: "procedural" as const, materialBindings: {}, uvScaleMm: 1000 },
    };
    expect(compiledNodeLabelText(fallback)).toContain("SAFE FALLBACK");
    expect(compiledNodeLabelVisible(fallback, {
      interactive: true, selected: false, hovered: false, renderMode: "preview",
    })).toBe(true);
    expect(compiledNodeLabelVisible(fallback, {
      interactive: false, selected: true, hovered: true, renderMode: "hero",
    })).toBe(false);
    const blocked = buildPreExportChecklist({
      issues: [],
      millworkCount: 4,
      packageDeckCount: 1,
      acceptedStillCount: 0,
      geometryFallbackIds: ["golden-base"],
    });
    expect(blocked.ready).toBe(false);
    expect(blocked.items.find((item) => item.id === "cabinet-geometry")?.status).toBe("fail");
    const node = compileLivingRoomObjectNode(
      createGoldenCabinetSceneProject().objects.find((item) => item.id === "golden-base")!,
    );
    expect(node.sourceObjectId).toBe("golden-base");
  });
});
