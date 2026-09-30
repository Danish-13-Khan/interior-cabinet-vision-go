import type { LightEntity } from "../interiorProject";
import { fixtureNumber } from "./lightFixtureProperties";
import type { ObjectLightMount } from "./lightObjectPose";
import type { PanelWallSide } from "./panelAttachment";
import type { WallLightMount } from "./lightWallPose";

export type CeilingLightMount = {
  kind: "ceiling";
  ceilingDropMm: number;
};

export type LightMount =
  | { kind: "free" }
  | ObjectLightMount
  | WallLightMount
  | CeilingLightMount;

function wallSide(value: unknown): PanelWallSide {
  return value === "exterior" ? "exterior" : "interior";
}

/** Object wins over wall, then ceiling, so a stale key cannot steal the host. */
export function readLightMount(light: LightEntity): LightMount {
  const hostObjectId = light.parameters.hostObjectId;
  if (typeof hostObjectId === "string" && hostObjectId) {
    return {
      kind: "object",
      hostObjectId,
      offsetXmm: fixtureNumber(light, "offsetXmm", 0),
      offsetYmm: fixtureNumber(light, "offsetYmm", -12),
      offsetZmm: fixtureNumber(light, "offsetZmm", 0),
      fitHostWidth: light.parameters.fitHostWidth === true,
    };
  }
  const hostWallId = light.parameters.hostWallId;
  if (typeof hostWallId === "string" && hostWallId) {
    return {
      kind: "wall",
      hostWallId,
      alongMm: fixtureNumber(light, "alongMm", 0),
      centerHeightMm: fixtureNumber(light, "centerHeightMm", 0),
      wallSide: wallSide(light.parameters.wallSide),
      fitHostWidth: light.parameters.fitHostWidth === true,
    };
  }
  if (light.parameters.hostSurface === "ceiling") {
    return { kind: "ceiling", ceilingDropMm: fixtureNumber(light, "ceilingDropMm", 0) };
  }
  return { kind: "free" };
}
