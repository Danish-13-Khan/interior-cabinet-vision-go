import {
  DirectionalLight, GridHelper, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Scene, Texture, WebGLRenderTarget,
} from "three";
import { describe, expect, it } from "vitest";
import { sceneGlbFileName } from "./exportSceneGlb";
import { getModelViewScene, registerModelViewScene } from "./modelViewSceneRegistry";
import {
  EXCLUDE_FROM_EXPORT,
  collectEditorOnlyObjects,
  usesRenderTargetTexture,
  withEditorOnlyObjectsHidden,
} from "./sceneExportFilter";

function buildScene() {
  const scene = new Scene();
  const cabinet = new Mesh();
  const grid = new GridHelper(4, 4);
  const light = new DirectionalLight();
  const gizmo = new Group();
  gizmo.userData[EXCLUDE_FROM_EXPORT] = true;
  gizmo.add(new Mesh());
  scene.add(cabinet, grid, light, gizmo);
  return { scene, cabinet, grid, light, gizmo };
}

describe("sceneExportFilter", () => {
  it("collects helpers, lights and tagged roots but not model meshes", () => {
    const { scene, cabinet, grid, light, gizmo } = buildScene();
    const found = collectEditorOnlyObjects(scene);
    expect(found).toEqual(expect.arrayContaining([grid, light, gizmo]));
    expect(found).not.toContain(cabinet);
    expect(found).toHaveLength(3);
  });

  it("excludes meshes that sample a render-target texture, like contact shadows", () => {
    const { scene, cabinet } = buildScene();
    const target = new WebGLRenderTarget(4, 4);
    const shadowPlane = new Mesh(new PlaneGeometry(), new MeshBasicMaterial({ map: target.texture }));
    scene.add(shadowPlane);
    expect(usesRenderTargetTexture(shadowPlane)).toBe(true);
    expect(usesRenderTargetTexture(cabinet)).toBe(false);
    expect(collectEditorOnlyObjects(scene)).toContain(shadowPlane);
    target.dispose();
  });

  it("keeps meshes with ordinary image textures", () => {
    const { scene } = buildScene();
    const textured = new Mesh(new PlaneGeometry(), new MeshBasicMaterial({ map: new Texture() }));
    scene.add(textured);
    expect(collectEditorOnlyObjects(scene)).not.toContain(textured);
  });

  it("skips objects that are already hidden", () => {
    const { scene, grid } = buildScene();
    grid.visible = false;
    expect(collectEditorOnlyObjects(scene)).not.toContain(grid);
  });

  it("hides editor objects during the run and restores them after, even on failure", async () => {
    const { scene, grid, cabinet } = buildScene();
    await withEditorOnlyObjectsHidden(scene, async () => {
      expect(grid.visible).toBe(false);
      expect(cabinet.visible).toBe(true);
    });
    expect(grid.visible).toBe(true);
    await expect(withEditorOnlyObjectsHidden(scene, async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(grid.visible).toBe(true);
  });
});

describe("modelViewSceneRegistry", () => {
  it("only clears when the registered scene unregisters", () => {
    const first = new Scene();
    const second = new Scene();
    const dropFirst = registerModelViewScene(first);
    const dropSecond = registerModelViewScene(second);
    dropFirst();
    expect(getModelViewScene()).toBe(second);
    dropSecond();
    expect(getModelViewScene()).toBeNull();
  });
});

describe("sceneGlbFileName", () => {
  it("slugs the project name", () => {
    expect(sceneGlbFileName("  Smith Kitchen / v2 ")).toBe("smith-kitchen-v2.glb");
    expect(sceneGlbFileName("")).toBe("scene.glb");
  });
});
