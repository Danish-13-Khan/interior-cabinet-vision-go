import { describe, expect, it } from "vitest";
import {
  designUxChromeForArea,
  designUxShellClassNames,
  designUxShowsCatalogRail,
  designUxShowsToolRail,
} from "./designUxShell";

describe("designUxShell (Phase E)", () => {
  it("strips edit chrome in Present / client strip", () => {
    const present = designUxChromeForArea("present");
    expect(present.editTools).toBe(false);
    expect(present.toolRail).toBe(false);
    expect(present.catalogPanel).toBe(false);
    expect(present.presentChrome).toBe(true);
    expect(present.clientStrip).toBe(true);

    const forced = designUxChromeForArea("cabinets", true);
    expect(forced.clientStrip).toBe(true);
    expect(forced.editTools).toBe(false);
  });

  it("keeps authoring chrome for Room / Cabinets / Materials", () => {
    expect(designUxChromeForArea("room").toolRail).toBe(true);
    expect(designUxChromeForArea("cabinets").catalogPanel).toBe(true);
    expect(designUxChromeForArea("materials").editTools).toBe(true);
    expect(designUxChromeForArea("review").toolRail).toBe(false);
    expect(designUxChromeForArea("review").catalogPanel).toBe(true);
  });

  it("gates catalog and tool rails for the shared shell", () => {
    expect(designUxShowsToolRail({
      area: "room", toolRailVisible: true, presenting: false,
    })).toBe(true);
    expect(designUxShowsToolRail({
      area: "present", toolRailVisible: true, presenting: false,
    })).toBe(false);
    expect(designUxShowsCatalogRail({
      area: "cabinets", toolRailVisible: true, presenting: false,
    })).toBe(true);
    expect(designUxShowsCatalogRail({
      area: "cabinets", toolRailVisible: true, presenting: true,
    })).toBe(false);
    expect(designUxShowsCatalogRail({
      area: "room", toolRailVisible: true, presenting: false, drawRoomActive: true,
    })).toBe(false);
  });

  it("emits drafting-studio shell class tokens", () => {
    expect(designUxShellClassNames({
      uiMode: "calm", appearance: "light", presenting: false,
    })).toContain("is-drafting-studio");
    expect(designUxShellClassNames({
      uiMode: "compact", appearance: "dark-frame", presenting: true,
    })).toEqual(expect.arrayContaining([
      "is-ui-compact",
      "is-appearance-dark-frame",
      "is-presenting",
      "is-client-strip",
    ]));
  });
});
