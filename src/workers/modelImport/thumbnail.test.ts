import { describe, expect, it, vi } from "vitest";
import { Box3, BoxGeometry, DataTexture, Group, Mesh, MeshStandardMaterial, PerspectiveCamera, Vector3 } from "three";
import { createImportedAssetObject } from "../../domain/livingRoom/assetImportPipeline";
import { disposeObject, encodeThumbnail, fitThumbnailCamera, releaseRenderer, renderModelThumbnail } from "./thumbnail";
import { buildTriangleGlb } from "./minimalGlb";

describe("import thumbnail", () => {
  it("encodes WebP when the browser does, otherwise PNG", () => {
    expect(encodeThumbnail({ toDataURL: () => "data:image/webp;base64,AA" })).toBe("data:image/webp;base64,AA");
    expect(encodeThumbnail({ toDataURL: () => "data:image/png;base64,BB" })).toBe("data:image/png;base64,BB");
    expect(encodeThumbnail({ toDataURL: () => "data:," })).toBeNull();
  });

  it("always loses the WebGL context, even when dispose throws", () => {
    const renderer = {
      renderLists: { dispose: vi.fn() },
      dispose: vi.fn(() => { throw new Error("gone"); }),
      forceContextLoss: vi.fn(),
    };
    expect(() => releaseRenderer(renderer as unknown as Parameters<typeof releaseRenderer>[0])).not.toThrow();
    expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
  });

  it("disposes geometry, materials and textures", () => {
    const map = new DataTexture(new Uint8Array(4), 1, 1);
    const material = new MeshStandardMaterial({ map });
    const geometry = new BoxGeometry(1, 1, 1);
    const root = new Group().add(new Mesh(geometry, material));
    const disposed = { geometry: vi.fn(), material: vi.fn(), texture: vi.fn() };
    geometry.addEventListener("dispose", disposed.geometry);
    material.addEventListener("dispose", disposed.material);
    map.addEventListener("dispose", disposed.texture);
    disposeObject(root);
    expect(disposed.geometry).toHaveBeenCalled();
    expect(disposed.material).toHaveBeenCalled();
    expect(disposed.texture).toHaveBeenCalled();
  });

  it("frames the whole model from a 3/4 view", () => {
    const camera = new PerspectiveCamera();
    const bounds = new Box3(new Vector3(-1000, 0, -500), new Vector3(1000, 800, 500));
    fitThumbnailCamera(camera, bounds);
    expect(camera.position.x).toBeGreaterThan(0);
    expect(camera.position.y).toBeGreaterThan(400);
    expect(camera.position.z).toBeGreaterThan(0);
    expect(camera.position.distanceTo(bounds.getCenter(new Vector3()))).toBeGreaterThan(1000);
  });

  it("returns no thumbnail instead of failing when there is no DOM/WebGL", async () => {
    await expect(renderModelThumbnail(buildTriangleGlb([-1, 0, 0, 1, 0, 0, 0, 1, 0]))).resolves.toBeNull();
  });

  it("does not persist the dialog thumbnail into the project document", () => {
    const object = createImportedAssetObject({
      id: "file:chair",
      name: "Chair",
      category: "imported",
      kind: "custom",
      dimensions: { widthMm: 600, heightMm: 800, depthMm: 600 },
      sourceUrl: "idb:sha256-00",
      thumbnailUrl: "data:image/png;base64,AA",
    }, "chair", "room", { x: 0, y: 0, z: 0 });
    expect(object.extensions?.assetImport).not.toHaveProperty("thumbnailUrl");
    expect(object.extensions?.assetImport).toMatchObject({ id: "file:chair", sourceUrl: "idb:sha256-00" });
  });
});
