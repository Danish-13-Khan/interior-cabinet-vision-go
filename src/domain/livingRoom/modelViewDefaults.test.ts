import { describe, expect, it } from "vitest";
import { createLivingRoomCameras } from "./cameras";
import { pickModelViewCameraId, preferModelViewCameraId } from "./modelViewDefaults";
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

describe("pickModelViewCameraId", () => {
  const cameras = createLivingRoomCameras("room-1", defaultLivingRoomIdFactory);
  const wide = preferModelViewCameraId(cameras);
  const tvWall = cameras.find((camera) => camera.name === "TV Wall")!.id;

  it("keeps the first candidate that belongs to the room", () => {
    expect(pickModelViewCameraId(cameras, [tvWall, wide])).toBe(tvWall);
    expect(pickModelViewCameraId(cameras, ["camera-in-another-room", null, tvWall])).toBe(tvWall);
  });

  it("falls back to the Model entry camera when no candidate is in the room", () => {
    expect(pickModelViewCameraId(cameras, ["camera-in-another-room", undefined])).toBe(wide);
    expect(pickModelViewCameraId([], [tvWall])).toBeNull();
  });
});
