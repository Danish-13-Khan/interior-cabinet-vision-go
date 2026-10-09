import { describe, expect, it } from "vitest";
import {
  fitStudioPanes,
  STUDIO_CANVAS_MIN,
  STUDIO_INSPECTOR_MIN,
  STUDIO_PANE_MIN,
  type StudioPaneFitInput,
} from "./studioPaneFit";

const both: StudioPaneFitInput = {
  hostWidth: 1920, chromeWidth: 0, catalog: 240, inspector: 320, catalogShown: true, inspectorShown: true,
};

function canvasWidth(input: StudioPaneFitInput) {
  const fit = fitStudioPanes(input);
  return input.hostWidth - input.chromeWidth
    - (input.catalogShown ? fit.catalogWidth : 0)
    - (input.inspectorShown ? fit.inspectorWidth : 0);
}

describe("fitStudioPanes", () => {
  it("keeps stored widths when the window has room", () => {
    const fit = fitStudioPanes(both);
    expect(fit.catalogWidth).toBe(240);
    expect(fit.inspectorWidth).toBe(320);
  });

  it("counts side chrome such as the 3D tool rail against the canvas", () => {
    const input = { ...both, hostWidth: 900, chromeWidth: 82, catalog: 368, inspector: 396 };
    expect(canvasWidth(input)).toBeGreaterThanOrEqual(STUDIO_CANVAS_MIN);
  });

  it("shrinks the catalog before the inspector on a narrow window", () => {
    const fit = fitStudioPanes({ ...both, hostWidth: 1000, catalog: 400, inspector: 400 });
    expect(fit.inspectorWidth).toBe(400);
    expect(fit.catalogWidth).toBe(1000 - STUDIO_CANVAS_MIN - 400);
  });

  it("never drops a pane below its minimum", () => {
    const fit = fitStudioPanes({ ...both, hostWidth: 600, catalog: 400, inspector: 400 });
    expect(fit.catalogWidth).toBe(STUDIO_PANE_MIN);
    expect(fit.inspectorWidth).toBe(STUDIO_INSPECTOR_MIN);
  });

  it("restores stored widths when the window grows again", () => {
    const narrow = fitStudioPanes({ ...both, hostWidth: 900, catalog: 400 });
    const wide = fitStudioPanes({ ...both, catalog: 400 });
    expect(narrow.catalogWidth).toBeLessThan(400);
    expect(wide.catalogWidth).toBe(400);
  });

  it("gives a pane the hidden neighbour's space", () => {
    const shown = fitStudioPanes({ ...both, hostWidth: 1200 });
    const hidden = fitStudioPanes({ ...both, hostWidth: 1200, inspectorShown: false });
    expect(hidden.catalogMax).toBeGreaterThan(shown.catalogMax);
  });

  it("caps each drag so the other pane keeps its displayed width", () => {
    const fit = fitStudioPanes({ ...both, hostWidth: 1200 });
    expect(fit.inspectorMax).toBe(1200 - STUDIO_CANVAS_MIN - fit.catalogWidth);
    const dragged = fitStudioPanes({ ...both, hostWidth: 1200, inspector: fit.inspectorMax });
    expect(dragged.catalogWidth).toBe(fit.catalogWidth);
  });
});
