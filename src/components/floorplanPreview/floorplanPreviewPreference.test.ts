import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  consumeFloorplanPreviewOnModel,
  getFloorplanPreviewRequestGeneration,
  peekFloorplanPreviewOnModel,
  requestFloorplanPreviewOnModel,
  subscribeFloorplanPreviewRequest,
} from "./floorplanPreviewPreference";

beforeEach(() => {
  while (consumeFloorplanPreviewOnModel()) { /* drain */ }
});

describe("floorplanPreviewPreference", () => {
  it("request then consume is one-shot", () => {
    expect(peekFloorplanPreviewOnModel()).toBe(false);
    requestFloorplanPreviewOnModel();
    expect(peekFloorplanPreviewOnModel()).toBe(true);
    expect(consumeFloorplanPreviewOnModel()).toBe(true);
    expect(consumeFloorplanPreviewOnModel()).toBe(false);
  });

  it("bumps generation and notifies subscribers while mounted", () => {
    const before = getFloorplanPreviewRequestGeneration();
    const spy = vi.fn();
    const unsubscribe = subscribeFloorplanPreviewRequest(spy);
    requestFloorplanPreviewOnModel();
    expect(getFloorplanPreviewRequestGeneration()).toBe(before + 1);
    expect(spy).toHaveBeenCalledTimes(1);
    // Simulate bridge consume on notify
    expect(consumeFloorplanPreviewOnModel()).toBe(true);
    unsubscribe();
    requestFloorplanPreviewOnModel();
    expect(spy).toHaveBeenCalledTimes(1);
    consumeFloorplanPreviewOnModel();
  });
});
