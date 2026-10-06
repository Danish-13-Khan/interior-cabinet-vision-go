import type { TemplateCardId } from "./types";
import { isApartmentTemplateCardId } from "./templateIds";

/**
 * Apartment hover clips play once (plan, then glide to the hero, whose last
 * frame matches the poster) and hold; room clips loop (Phase 4).
 */
export function cardClipShouldLoop(templateId: TemplateCardId): boolean {
  return !isApartmentTemplateCardId(templateId);
}
