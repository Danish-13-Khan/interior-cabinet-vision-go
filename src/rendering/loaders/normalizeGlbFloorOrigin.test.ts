import { Box3, BoxGeometry, Group, Mesh, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { computeGlbScaleFactors } from "../../domain/livingRoom/glbScale";
import { normalizeGlbFloorOrigin } from "./normalizeGlbFloorOrigin";

describe("normalizeGlbFloorOrigin", () => {
  it("floors and centers in local space even when parented under translation and scale", () => {
    const parent = new Group();
    parent.position.set(1.9, 0, -0.9);
    parent.scale.set(2.5, 2.5, 2.5);

    const scene = new Group();
    const mesh = new Mesh(new BoxGeometry(0.4, 0.8, 0.2));
    mesh.position.set(0.1, 0.4, -0.05);
    scene.add(mesh);
    parent.add(scene);
    parent.updateMatrixWorld(true);

    const measured = normalizeGlbFloorOrigin(scene);
    const scale = computeGlbScaleFactors(
      { widthMm: 1000, heightMm: 2000, depthMm: 500 },
      measured,
    );
    parent.scale.set(scale.x, scale.y, scale.z);
    parent.updateMatrixWorld(true);

    const bounds = new Box3().setFromObject(scene);
    const worldCenter = bounds.getCenter(new Vector3());
    expect(worldCenter.x).toBeCloseTo(1.9, 5);
    expect(worldCenter.z).toBeCloseTo(-0.9, 5);
    expect(bounds.min.y).toBeCloseTo(0, 5);
    expect(scene.parent).toBe(parent);
  });
});
