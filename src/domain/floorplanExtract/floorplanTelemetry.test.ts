import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  clearFloorplanTelemetry,
  listFloorplanTelemetry,
  recordFloorplanTelemetry,
  subscribeFloorplanTelemetry,
  summarizeFloorplanTelemetry,
} from "./floorplanTelemetry";

describe("floorplanTelemetry", () => {
  beforeEach(() => clearFloorplanTelemetry());

  it("records export outcomes and summarizes including cancelled re-apply", () => {
    recordFloorplanTelemetry({
      type: "glb_export", outcome: "cache_miss", latencyMs: 40, fingerprint: "a",
    });
    recordFloorplanTelemetry({
      type: "glb_export", outcome: "cache_hit", latencyMs: 1, fingerprint: "a",
    });
    recordFloorplanTelemetry({ type: "refresh_source_preview" });
    recordFloorplanTelemetry({ type: "reapply_extract", outcome: "ok" });
    recordFloorplanTelemetry({ type: "reapply_extract", outcome: "cancelled" });
    const s = summarizeFloorplanTelemetry();
    expect(s.cacheHits).toBe(1);
    expect(s.cacheMisses).toBe(1);
    expect(s.refresh).toBe(1);
    expect(s.reapplyOk).toBe(1);
    expect(s.reapplyCancelled).toBe(1);
    expect(s.avgExportLatencyMs).toBeCloseTo(20.5, 5);
    expect(listFloorplanTelemetry()).toHaveLength(5);
  });

  it("notifies subscribers and unsubscribes", () => {
    const seen: string[] = [];
    const stop = subscribeFloorplanTelemetry((e) => seen.push(e.type));
    recordFloorplanTelemetry({ type: "refresh_source_preview" });
    stop();
    recordFloorplanTelemetry({ type: "reapply_extract", outcome: "cancelled" });
    expect(seen).toEqual(["refresh_source_preview"]);
  });
});
