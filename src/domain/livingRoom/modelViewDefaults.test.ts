import { describe, expect, it } from "vitest";
import { createLivingRoomCameras } from "./cameras";
import { preferModelViewCameraId } from "./modelViewDefaults";
import { defaultLivingRoomIdFactory } from "./ids";

describe("preferModelViewCameraId", () => {
  it("prefers Wide Room so Model opens on the full staged room", () => {
    const cameras = createLivingRoomCameras("room-1", defaultLivingRoomIdFactory);
    const preferred = preferModelViewCameraId(cameras);
    const wide = cameras.find((camera) => camera.name === "Wide Room");
    expect(preferred).toBe(wide?.id);
    expect(cameras.find((camera) => camera.id === preferred)?.name).not.toBe("TV Wall");
  });
});
