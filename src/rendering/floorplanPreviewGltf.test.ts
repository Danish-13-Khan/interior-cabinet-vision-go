import { describe, expect, it, vi } from "vitest";

vi.mock("@react-three/drei", () => ({
  useGLTF: { clear: vi.fn() },
}));

import { useGLTF } from "@react-three/drei";
import { clearFloorplanPreviewGltf } from "./floorplanPreviewGltf";

describe("clearFloorplanPreviewGltf", () => {
  it("calls useGLTF.clear for the object URL", () => {
    clearFloorplanPreviewGltf("blob:preview-1");
    expect(useGLTF.clear).toHaveBeenCalledWith("blob:preview-1");
  });

  it("swallows clear failures", () => {
    vi.mocked(useGLTF.clear).mockImplementationOnce(() => {
      throw new Error("gone");
    });
    expect(() => clearFloorplanPreviewGltf("blob:x")).not.toThrow();
  });
});
