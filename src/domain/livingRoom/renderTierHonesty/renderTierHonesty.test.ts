import { describe, expect, it } from "vitest";
import { evaluateHonesty } from "../phase1Benchmarks/evaluateHonesty";
import { describePresetHonesty } from "../presetHonesty";
import { describeStillHonesty } from "../stillHonesty";
import {
  buildClientPresentationHonesty,
  isPackageDeliverableRenderQuality,
  RENDER_TIER_CATALOG,
  resolveRenderStudioHonesty,
  tierIdForRenderQuality,
} from ".";

describe("render tier honesty", () => {
  it("keeps Draft, Client Preview hero, and Hybrid Still distinct", () => {
    const draft = resolveRenderStudioHonesty({ view: "preview", quality: "draft" });
    const client = resolveRenderStudioHonesty({ view: "preview", quality: "client-preview" });
    const still = resolveRenderStudioHonesty({ view: "still", quality: "client-preview" });
    expect(draft.tierId).toBe("draft-preview");
    expect(client.tierId).toBe("client-preview-hero");
    expect(still.tierId).toBe("hybrid-still");
    expect(new Set([draft.headline, client.headline, still.headline]).size).toBe(3);
  });

  it("maps Standard to balanced-hero instead of client-preview-hero", () => {
    const honesty = resolveRenderStudioHonesty({ view: "preview", quality: "standard" });
    expect(honesty.tierId).toBe("balanced-hero");
    expect(honesty.headline).toBe("Balanced Preview");
    expect(honesty.tierId).not.toBe("client-preview-hero");
  });

  it("uses the rendered result quality on the result tab", () => {
    const honesty = resolveRenderStudioHonesty({
      view: "result",
      quality: "draft",
      resultQuality: "client-preview",
    });
    expect(honesty.tierId).toBe("client-preview-hero");
    expect(honesty.shortBadge).toContain("CLIENT PREVIEW");
  });

  it("avoids photoreal claims across tier copy", () => {
    const corpus = [
      ...RENDER_TIER_CATALOG.flatMap((entry) => [entry.headline, entry.subline, entry.shortBadge]),
      describePresetHonesty("draft", "preview").subline,
      describePresetHonesty("client-preview", "hero").subline,
      describeStillHonesty().subline,
    ];
    expect(evaluateHonesty(corpus).status).toBe("pass");
  });

  it("records hero and still tiers in client package honesty", () => {
    const honesty = buildClientPresentationHonesty(
      {
        render: {
          cameraId: "cam-1",
          cameraName: "Wide",
          quality: "client-preview",
          widthPx: 1920,
          heightPx: 1080,
          lightingRecipeId: "studio-soft",
          exposure: 1,
          composition: "architectural",
          createdAt: "2026-08-28T00:00:00.000Z",
        },
        acceptedStills: [{
          schemaVersion: 2,
          jobId: "sj-1",
          projectId: "proj",
          projectContentHash: "hash",
          snapshotId: "snap",
          cameraId: "cam-1",
          engine: { id: "stilljob-hero", version: "1.0.0" },
          seed: 0,
          allowedEnhancements: ["exposure_grade"],
          mode: "faithful_enhance",
          acceptanceStatus: "accepted",
          stillOutputPath: "sj-1-still.png",
        }],
        files: [],
      },
      "demo-hero-render.png",
    );
    expect(honesty.tiers.map((tier) => tier.tierId)).toEqual([
      "client-preview-hero",
      "hybrid-still",
    ]);
    expect(honesty.tiers[1]?.assets).toEqual(["sj-1-still.png"]);
  });

  it("excludes Draft renders from package honesty and deliverable checks", () => {
    expect(isPackageDeliverableRenderQuality("draft")).toBe(false);
    expect(tierIdForRenderQuality("draft")).toBe("draft-preview");
    const honesty = buildClientPresentationHonesty(
      {
        render: {
          cameraId: "cam-1",
          cameraName: "Wide",
          quality: "draft",
          widthPx: 1280,
          heightPx: 720,
          lightingRecipeId: "studio-soft",
          exposure: 1,
          composition: "architectural",
          createdAt: "2026-08-28T00:00:00.000Z",
        },
        acceptedStills: [],
        files: [],
      },
      "demo-hero-render.png",
    );
    expect(honesty.tiers).toEqual([]);
  });
});
