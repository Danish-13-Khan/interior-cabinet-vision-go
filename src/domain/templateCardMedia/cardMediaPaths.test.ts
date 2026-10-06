import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CARD_CLIP_DURATION_MS } from "../templateCardsCapture/clipTimeline";
import { CARD_MEDIA } from "./cardMedia.generated";
import { cardClipSources, cardMediaForTemplate, catalogPosterFromObjectKey } from "./cardMediaPaths";
import { TEMPLATE_CARD_IDS } from "./templateIds";

describe("card media paths", () => {
  it("lists every template card id in CARD_MEDIA", () => {
    for (const id of TEMPLATE_CARD_IDS) {
      expect(CARD_MEDIA[id]).toBeDefined();
    }
  });

  it("reads manifest entries without guessing paths", () => {
    const media = cardMediaForTemplate("template:apartment:studio:v1");
    expect(media.poster.w800).toBe("catalog/templates/apartment-studio-v2.webp");
    expect(media.plan?.w800).toBe("catalog/templates/apartment-studio-plan-v2.webp");
  });

  it("throws when manifest entry is missing", () => {
    expect(() => cardMediaForTemplate("template:apartment:missing:v1" as never)).toThrow(/CARD_MEDIA/);
  });

  it("resolves clip URLs when manifest lists a clip", () => {
    const withClip = TEMPLATE_CARD_IDS.map((id) => CARD_MEDIA[id]?.clip).find(Boolean);
    if (!withClip) return;
    const sources = cardClipSources(withClip, "/");
    expect(sources.durationMs).toBe(CARD_CLIP_DURATION_MS);
    expect(sources.webm).toMatch(/-clip-v2\.webm$/);
    expect(sources.mp4).toMatch(/-clip-v2\.mp4$/);
  });

  it("checks clip files on disk when manifest entries include clip", () => {
    for (const id of TEMPLATE_CARD_IDS) {
      const clip = CARD_MEDIA[id]?.clip;
      if (!clip) continue;
      expect(clip.durationMs).toBe(CARD_CLIP_DURATION_MS);
      expect(existsSync(join(process.cwd(), "public", clip.webm))).toBe(true);
      expect(existsSync(join(process.cwd(), "public", clip.mp4))).toBe(true);
    }
  });

  it("builds catalog srcset or single PNG ref", () => {
    expect(catalogPosterFromObjectKey("catalog/templates/l-kitchen-v2.webp")).toEqual({
      kind: "srcset",
      poster: {
        w800: "catalog/templates/l-kitchen-v2.webp",
        w1600: "catalog/templates/l-kitchen-v2-1600.webp",
      },
    });
    expect(catalogPosterFromObjectKey("catalog/templates/living-room-v1.png")).toEqual({
      kind: "single",
      src: "catalog/templates/living-room-v1.png",
    });
  });
});
