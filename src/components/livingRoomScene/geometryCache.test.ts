import { describe, expect, it, vi } from "vitest";
import { boxPrimitive, polygonPrismPrimitive } from "../../domain/livingRoom/scenePrimitives";
import { acquireCompiledGeometry, compiledGeometryCacheSize } from "./geometryCache";

const box = (width: number) => boxPrimitive("test", { width, height: 100, depth: 100 }, { x: 0, y: 0, z: 0 }, "test");

describe("mounted geometry ownership", () => {
  it("shares geometry until the last consumer releases it", () => {
    const first = acquireCompiledGeometry(box(100));
    const second = acquireCompiledGeometry(box(100));
    const disposed = vi.fn();
    first.geometry.addEventListener("dispose", disposed);
    expect(first.geometry).toBe(second.geometry);
    first.release();
    first.release();
    expect(disposed).not.toHaveBeenCalled();
    second.release();
    expect(disposed).toHaveBeenCalledTimes(1);
    expect(compiledGeometryCacheSize()).toBe(0);
  });

  it("releases previous resize geometry while another scene stays mounted", () => {
    const stable = acquireCompiledGeometry(box(100));
    for (let width = 101; width < 301; width++) {
      const resized = acquireCompiledGeometry(box(width));
      expect(compiledGeometryCacheSize()).toBe(2);
      resized.release();
    }
    expect(compiledGeometryCacheSize()).toBe(1);
    stable.release();
    expect(compiledGeometryCacheSize()).toBe(0);
  });

  it("recreates disposed polygon geometry on remount", () => {
    const primitive = polygonPrismPrimitive("floor", [{ x: 0, z: 0 }, { x: 4000, z: 0 }, { x: 0, z: 3000 }], [], 12, -6, "test");
    const first = acquireCompiledGeometry(primitive);
    first.release();
    const second = acquireCompiledGeometry(primitive);
    expect(second.geometry).not.toBe(first.geometry);
    expect(second.geometry.getAttribute("position").count).toBeGreaterThan(0);
    second.release();
    expect(compiledGeometryCacheSize()).toBe(0);
  });
});
