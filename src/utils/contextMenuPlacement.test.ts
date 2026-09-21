import { describe, expect, it } from "vitest";
import { placeContextSubmenu } from "./contextMenuPlacement";

const submenu = { width: 188, height: 280 };
const viewport = { width: 1280, height: 800 };

describe("placeContextSubmenu", () => {
  it("opens right and down when there is room", () => {
    const next = placeContextSubmenu({
      trigger: { top: 80, right: 220, bottom: 108, left: 40 },
      submenu,
      viewport,
    });
    expect(next.side).toBe("right");
    expect(next.vertical).toBe("down");
    expect(next.maxHeight).toBe(320);
  });

  it("opens left near the right edge", () => {
    const next = placeContextSubmenu({
      trigger: { top: 80, right: 1260, bottom: 108, left: 1080 },
      submenu,
      viewport,
    });
    expect(next.side).toBe("left");
    expect(next.vertical).toBe("down");
  });

  it("opens up near the bottom edge and clamps height", () => {
    const next = placeContextSubmenu({
      trigger: { top: 760, right: 220, bottom: 788, left: 40 },
      submenu,
      viewport,
    });
    expect(next.vertical).toBe("up");
    expect(next.maxHeight).toBeLessThanOrEqual(788 - 8);
    expect(next.maxHeight).toBeGreaterThanOrEqual(48);
  });
});
