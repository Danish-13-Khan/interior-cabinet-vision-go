import type { InteriorProject } from "../../domain/interiorProject";
import { listGoldenSceneCabinets, listGoldenSceneCountertops } from "../../domain/livingRoom";

export function goldenSemanticsEnabled() {
  return typeof sessionStorage !== "undefined"
    && sessionStorage.getItem("golden-scene-semantics") === "1";
}

/** Playwright-only compiled semantics. Hidden unless the golden journey opts in. */
export function CabinetSceneSemantics({ project }: { project: InteriorProject }) {
  if (!goldenSemanticsEnabled()) return null;
  const cabinets = listGoldenSceneCabinets(project);
  const countertops = listGoldenSceneCountertops(project);
  if (cabinets.length === 0 && countertops.length === 0) return null;
  return (
    <ul data-testid="lr-scene-semantics" className="lr-scene-semantics-sr" aria-hidden="true">
      {cabinets.map((cabinet) => (
        <li
          key={cabinet.objectId}
          data-object-id={cabinet.objectId}
          data-family-id={cabinet.familyId}
          data-cabinet-type={cabinet.cabinetType}
          data-geometry={cabinet.geometry}
          data-roles={cabinet.roles.join(",")}
          data-width-mm={cabinet.widthMm}
          data-height-mm={cabinet.heightMm}
          data-y-mm={cabinet.yMm}
        />
      ))}
      {countertops.map((top) => (
        <li
          key={top.nodeId}
          data-role={top.role}
          data-countertop-id={top.id}
          data-geometry={top.geometry}
          data-cabinet-ids={top.cabinetIds.join(",")}
          data-width-mm={top.widthMm}
          data-depth-mm={top.depthMm}
          data-thickness-mm={top.thicknessMm}
        />
      ))}
    </ul>
  );
}
