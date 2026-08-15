import { describe, expect, it } from "vitest";
import { publicAssetUrl } from "./publicAssetUrl";

describe("publicAssetUrl", () => {
  it("keeps root-relative paths for local Vite and Tauri", () => {
    expect(publicAssetUrl("models/soft-goods/sofa-3-seat.glb", "/")).toBe(
      "/models/soft-goods/sofa-3-seat.glb",
    );
  });

  it("prefixes the GitHub Pages repo base so assets are not requested from the user root", () => {
    expect(
      publicAssetUrl("models/soft-goods/sofa-3-seat.glb", "/interior-cabinet-vision-go/"),
    ).toBe("/interior-cabinet-vision-go/models/soft-goods/sofa-3-seat.glb");
    expect(publicAssetUrl("/textures/wood/oak-color.png", "/interior-cabinet-vision-go")).toBe(
      "/interior-cabinet-vision-go/textures/wood/oak-color.png",
    );
  });
});
