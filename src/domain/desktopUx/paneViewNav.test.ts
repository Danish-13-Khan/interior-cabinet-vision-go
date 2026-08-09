import { describe, expect, it } from "vitest";
import {
  DEFAULT_PANE_VIEW,
  PANE_ZOOM_MAX,
  PANE_ZOOM_MIN,
  clampPaneView,
  fitPaneView,
  formatPaneScaleLabel,
  formatPaneZoomPercent,
  panPaneView,
  zoomPaneView,
} from "./paneViewNav";

describe("paneViewNav", () => {
  it("clamps zoom and pans into safe bounds", () => {
    expect(clampPaneView({ zoom: 0.01, panX: 12.34, panY: NaN })).toEqual({
      zoom: PANE_ZOOM_MIN,
      panX: 12.3,
      panY: 0,
    });
    expect(clampPaneView({ zoom: 99 }).zoom).toBe(PANE_ZOOM_MAX);
    expect(clampPaneView(null)).toEqual(DEFAULT_PANE_VIEW);
  });

  it("zooms around an origin without losing the focus point", () => {
    const next = zoomPaneView({ zoom: 1, panX: 0, panY: 0 }, 2, 100, 50);
    expect(next.zoom).toBe(2);
    expect(next.panX).toBe(100 - 100 * 2);
    expect(next.panY).toBe(50 - 50 * 2);
  });

  it("pans by delta and fits content into the viewport", () => {
    expect(panPaneView(DEFAULT_PANE_VIEW, 10, -4)).toEqual({
      zoom: 1,
      panX: 10,
      panY: -4,
    });
    const fitted = fitPaneView(
      { width: 400, height: 200 },
      { width: 200, height: 200 },
      0,
    );
    expect(fitted.zoom).toBe(0.5);
    expect(fitted.panX).toBe(0);
    expect(fitted.panY).toBe(50);
  });

  it("formats scale labels from sheet scale and zoom", () => {
    expect(formatPaneZoomPercent(1.2)).toBe("120%");
    expect(formatPaneScaleLabel("1:50", 1)).toBe("1:50 · 100%");
  });
});
