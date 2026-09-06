import type { InteriorProject } from "../../domain/interiorProject";
import {
  listHiddenWalls,
  wallVisibilityLabelInProject,
} from "../../domain/livingRoom";

type ModelWallVisibilityPanelProps = {
  project: InteriorProject;
  onShowWall: (wallId: string) => void;
  onShowAllWalls: () => void;
};

/** Lists walls with visible===false and offers Show / Show All (M2). */
export function ModelWallVisibilityPanel({
  project,
  onShowWall,
  onShowAllWalls,
}: ModelWallVisibilityPanelProps) {
  const hidden = listHiddenWalls(project);
  if (hidden.length === 0) return null;

  return (
    <aside className="lr-wall-visibility-panel" data-testid="model-wall-visibility" aria-label="Hidden walls">
      <header>
        <strong>Hidden walls</strong>
        <button type="button" data-testid="model-show-all-walls" onClick={onShowAllWalls}>
          Show All Walls
        </button>
      </header>
      <ul>
        {hidden.map((wall) => (
          <li key={wall.id}>
            <span>{wallVisibilityLabelInProject(project, wall)}</span>
            <button
              type="button"
              data-testid={`model-show-wall-${wall.id}`}
              onClick={() => onShowWall(wall.id)}
            >
              Show Wall
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
