import type { InteriorProject } from "../../domain/interiorProject";
import {
  listSiteMeasureChecklistItems,
  type SiteMeasureUserKey,
} from "../../domain/livingRoom";

export function SiteMeasureChecklist({
  project,
  onToggle,
}: {
  project: InteriorProject;
  onToggle: (key: SiteMeasureUserKey, value: boolean) => void;
}) {
  const items = listSiteMeasureChecklistItems(project);
  return (
    <div className="lr-site-measure-checklist" data-testid="lr-site-measure-checklist">
      <strong>Site measure checklist</strong>
      <small>Optional — tick what you have on site.</small>
      <ul>
        {items.map((item) => (
          <li key={item.key}>
            <label>
              <input
                type="checkbox"
                data-testid={`lr-site-check-${item.key}`}
                checked={item.checked}
                disabled={item.auto}
                onChange={(event) => {
                  if (item.auto) return;
                  onToggle(item.key as SiteMeasureUserKey, event.target.checked);
                }}
              />
              <span>{item.label}{item.auto ? " (auto)" : ""}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
