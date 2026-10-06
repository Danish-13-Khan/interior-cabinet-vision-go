import { describe, expect, it } from "vitest";
import { CARD_MEDIA } from "./cardMedia.generated";
import { cardMediaForTemplate, catalogPosterFromObjectKey } from "./cardMediaPaths";
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
