import { BoxGeometry, DataTexture, Group, Mesh, MeshStandardMaterial, Texture } from "three";
import { describe, expect, it } from "vitest";
import { stripUnloadedTextures } from "./stripUnloadedTextures";

describe("stripUnloadedTextures", () => {
  it("clears texture slots whose image never loaded and keeps real ones", () => {
    const material = new MeshStandardMaterial();
    material.map = new Texture();
    material.normalMap = new DataTexture(new Uint8Array(4), 1, 1);
    const root = new Group();
    root.add(new Mesh(new BoxGeometry(), material));

    expect(stripUnloadedTextures(root)).toBe(1);
    expect(material.map).toBeNull();
    expect(material.normalMap).not.toBeNull();
  });

  it("handles multi-material meshes", () => {
    const first = new MeshStandardMaterial({ map: new Texture() });
    const second = new MeshStandardMaterial({ roughnessMap: new Texture() });
    const root = new Group();
    root.add(new Mesh(new BoxGeometry(), [first, second]));

    expect(stripUnloadedTextures(root)).toBe(2);
    expect(first.map).toBeNull();
    expect(second.roughnessMap).toBeNull();
  });
});
