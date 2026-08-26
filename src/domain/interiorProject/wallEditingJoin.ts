import { pointKey } from "./planTopology";
import type { InteriorProject } from "./types";
import { joinPlanNodes } from "./wallEditingJoinNodes";

export { joinPlanNodes } from "./wallEditingJoinNodes";

/** Join all nodes that share the same snapped plan coordinate. */
export function mergeCoincidentPlanNodes(project: InteriorProject): InteriorProject {
  const groups = new Map<string, string[]>();
  for (const node of project.nodes) {
    const key = pointKey(node.position);
    groups.set(key, [...(groups.get(key) ?? []), node.id]);
  }
  let next = project;
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    const [keep, ...rest] = ids;
    for (const remove of rest) next = joinPlanNodes(next, keep!, remove);
  }
  return next;
}
