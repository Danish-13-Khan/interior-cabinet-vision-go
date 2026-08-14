import { describePresetHonesty } from "../presetHonesty";
import type { Phase1CheckResult } from "./proofTypes";

const NEGATED_CLAIM =
  /\b(do\s+not|don't|never|without|avoid|out of scope|not first|not chase|fails if|not claim|no longer|≠|before pretending)\b/i;

/**
 * Affirmative marketing claims only.
 * Roadmap/table labels like “Photorealistic libraries” and “do not chase Synaps” are allowed.
 */
export function lineAffirmsForbiddenClaim(line: string): boolean {
  const text = line.trim();
  if (!text) return false;
  if (NEGATED_CLAIM.test(text)) return false;
  if (/^[\s*#-]*claims of\b/i.test(text)) return false;
  if (/\b(not|never)\b.{0,48}\b(photoreal|synaps|AI)\b/i.test(text)) return false;

  if (/\b(AI-enhanced|AI stills?|midjourney)\b/i.test(text)) return true;

  if (
    /\b(is|delivers|offers|achieves|provides|guarantees|ships)\b[^.!?\n]{0,72}\b(photoreal(?:ism|istic)?|synaps)\b/i
      .test(text)
  ) {
    return true;
  }

  if (/\b(synaps-class|synaps parity|photoreal client|photoreal marketing)\b/i.test(text)) {
    return true;
  }

  return false;
}

export function collectPresetHonestyCorpus(): string[] {
  const qualities = ["draft", "standard", "presentation", "client-preview"] as const;
  const modes = ["preview", "hero"] as const;
  const texts: string[] = [];
  for (const quality of qualities) {
    for (const mode of modes) {
      const honesty = describePresetHonesty(quality, mode);
      texts.push(honesty.headline, honesty.subline, honesty.shortBadge);
    }
  }
  return texts;
}

/**
 * Honesty gate: preset UI copy + optional README/UI corpus lines.
 * Negated / “out of scope” mentions of Synaps/photoreal are allowed.
 */
export function evaluateHonesty(extraCorpus: readonly string[] = []): Phase1CheckResult {
  const corpus = [...collectPresetHonestyCorpus(), ...extraCorpus];
  const lines = corpus.flatMap((text) => text.split(/\r?\n/));
  const hit = lines.find((line) => lineAffirmsForbiddenClaim(line));
  return {
    id: "honesty",
    status: hit ? "fail" : "pass",
    detail: hit
      ? `Forbidden claim language found: ${hit.trim().slice(0, 120)}`
      : "Preset honesty + README/UI corpus avoid affirmative photoreal / Synaps / AI claims.",
  };
}
