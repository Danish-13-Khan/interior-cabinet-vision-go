import { describe, expect, it } from "vitest";
import { BoxGeometry, Group, Matrix4, Mesh, SkinnedMesh } from "three";
import { enableGlbFrustumCulling } from "./glbFrustumBounds";
import { glbInstanceMatrix, meshMatrixUnderTemplate } from "./glbInstanceMatrix";
import { glbInstanceKey, instancedGlbNodeIds } from "./glbInstancePlan";
import type { RenderBinding } from "./renderAssetContracts";

function binding(asset: string, slots: Record<string, string> = {}): RenderBinding {
  return { strategy: "glb", modelAssetId: asset, materialBindings: slots };
}

describe("GLB reuse", () => {
  it("culls a static mesh from a fresh bounding sphere and leaves a skinned mesh alone", () => {
    const mesh = new Mesh(new BoxGeometry(2, 2, 2));
    mesh.geometry.boundingSphere = null;
    mesh.frustumCulled = false;
    const skinned = new SkinnedMesh(new BoxGeometry(1, 1, 1));
    const root = new Group();
    root.add(mesh, skinned);
    enableGlbFrustumCulling(root);
    expect(mesh.frustumCulled).toBe(true);
    expect(mesh.geometry.boundingSphere?.radius).toBeGreaterThan(0);
    expect(skinned.frustumCulled).toBe(false);
  });

  it("batches only repeated models that share material slots, skipping the live one", () => {
    const nodes = [
      { id: "a", renderBinding: binding("sofa", { fabric: "wool" }) },
      { id: "b", renderBinding: binding("sofa", { fabric: "wool" }) },
      { id: "c", renderBinding: binding("sofa", { fabric: "linen" }) },
      { id: "d", renderBinding: binding("chair") },
    ];
    expect(glbInstanceKey(nodes[0]!.renderBinding)).toBe(glbInstanceKey(nodes[1]!.renderBinding));
    expect(instancedGlbNodeIds(nodes, new Set(["a"]))).toEqual(new Set(["b"]));
    expect(instancedGlbNodeIds(nodes, new Set())).toEqual(new Set(["a", "b"]));
  });

  it("places an instance at the node, then the mesh offset inside the model", () => {
    const template = new Group();
    template.position.set(2, 0, 0);
    const mesh = new Mesh();
    mesh.position.set(0.5, 0, 0);
    template.add(mesh);
    const local = meshMatrixUnderTemplate(template, mesh);
    const placed = glbInstanceMatrix(
      { x: 1000, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 },
      local,
    );
    const origin = new Matrix4();
    expect(placed.elements[12]).toBeCloseTo(origin.elements[12] + 1 + 2.5);
  });
});
