import type { InteriorProject } from "../../domain/interiorProject";
import { collectRateCategories, type RateCategorySummary } from "../../domain/interiorEstimate/categories";
import { setEstimateCategoryRate } from "../../domain/interiorEstimate/state";
import type { InteriorEstimateLine } from "../../domain/interiorEstimate/measure";

const UNIT_LABEL: Record<string, string> = { each: "each", m2: "m²", lm: "metre" };

type Props = {
  lines: readonly InteriorEstimateLine[];
  onPatchDocument: (update: (project: InteriorProject) => InteriorProject) => void;
};

/** Rates entered once per measured category. A line rate still overrides its category. */
export function InteriorEstimateRates({ lines, onPatchDocument }: Props) {
  const categories = collectRateCategories(lines);
  if (categories.length === 0) return null;
  const setRate = (category: string, value: string) =>
    onPatchDocument((project) =>
      setEstimateCategoryRate(project, category, value === "" ? null : Number(value)));
  return (
    <section>
      <h4>Your rates by category</h4>
      <p>
        Enter a rate once and every measured line in that category uses it. Clearing a rate returns
        those lines to needing a rate rather than charging zero.
      </p>
      <div className="ipt-fields">
        {categories.map((category: RateCategorySummary) => (
          <label key={category.category}>
            {category.label} · per {UNIT_LABEL[category.unit] ?? category.unit}
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Required"
              aria-label={`Rate for ${category.label} per ${UNIT_LABEL[category.unit] ?? category.unit}`}
              value={category.rate ?? ""}
              onChange={(event) => setRate(category.category, event.target.value)}
            />
            <small>
              {category.lineCount} {category.lineCount === 1 ? "line" : "lines"}
              {category.needsRate ? " · needs a rate" : ""}
            </small>
          </label>
        ))}
      </div>
    </section>
  );
}
