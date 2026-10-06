import { describe, expect, it } from "vitest";
import { cardClipShouldLoop } from "./cardClipPolicy";

describe("cardClipPolicy", () => {
  it("loops catalog room clips only", () => {
    expect(cardClipShouldLoop("template:apartment:studio:v1")).toBe(false);
    expect(cardClipShouldLoop("template:core:living-room:v1")).toBe(true);
  });
});
