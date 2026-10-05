import { useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import {
  getPlanGuides,
  removePlanGuide,
  updatePlanGuide,
  type PlanGuide,
  type PlanGuidePatch,
} from "../../domain/livingRoom/planGuides";
import { NumberField } from "./NumberField";

type PatchDocument = (update: (current: InteriorProject) => InteriorProject, status: string) => void;

function GuideLabelField({ guide, onCommit }: { guide: PlanGuide; onCommit: (label: string) => void }) {
  const [draft, setDraft] = useState(guide.label ?? "");
  return (
    <label className="lr-plan-guide-label-field">
      <span>Label</span>
      <input
        aria-label={`Guide ${guide.label || guide.axis.toUpperCase()} label`}
        data-testid={`lr-guide-label-${guide.id}`}
        value={draft}
        maxLength={12}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => { if (draft.trim() !== (guide.label ?? "")) onCommit(draft); }}
        onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
      />
    </label>
  );
}

/** Guide list: label, position, lock and delete. Placing and dragging happen on the plan. */
export function PlanGuidesPanel({ project, onPatchDocument }: { project: InteriorProject; onPatchDocument: PatchDocument }) {
  const guides = getPlanGuides(project);
  const update = (guide: PlanGuide, patch: PlanGuidePatch, status: string) =>
    onPatchDocument((current) => updatePlanGuide(current, guide.id, patch), status);
  return (
    <section className="lr-plan-guides-panel" data-testid="lr-plan-guides-panel" aria-label="Plan guides">
      <strong>Plan guides</strong>
      {guides.length === 0 ? (
        <small>Use <b>Guide ↕</b> or <b>Guide ↔</b> in the toolbar, then click the plan to add grid lines.</small>
      ) : guides.map((guide) => (
        <div key={guide.id} className="lr-plan-guide-row" data-testid={`lr-guide-row-${guide.id}`}>
          <span className="lr-plan-guide-axis">{guide.axis === "x" ? "↕ X" : "↔ Z"}</span>
          <GuideLabelField key={`${guide.id}:${guide.label ?? ""}`} guide={guide}
            onCommit={(label) => update(guide, { label }, "Renamed plan guide.")} />
          {guide.locked ? (
            <small className="lr-plan-guide-position">{guide.axis.toUpperCase()} {guide.positionMm} mm</small>
          ) : (
            <NumberField label={guide.axis.toUpperCase()} value={guide.positionMm}
              onChange={(positionMm) => update(guide, { positionMm }, "Moved plan guide.")} />
          )}
          <label className="lr-plan-guide-lock">
            <input type="checkbox" checked={Boolean(guide.locked)} aria-label={`Lock guide ${guide.label ?? ""}`.trim()}
              onChange={(event) => update(guide, { locked: event.target.checked }, event.target.checked ? "Locked plan guide." : "Unlocked plan guide.")} />
            Lock
          </label>
          <button type="button" className="is-danger" aria-label={`Delete guide ${guide.label ?? ""}`.trim()}
            onClick={() => onPatchDocument((current) => removePlanGuide(current, guide.id), "Removed plan guide.")}>
            Delete
          </button>
        </div>
      ))}
    </section>
  );
}
