import type { CabinetInstance } from "../cabinetDimensions";
import { createCabinetGeometry } from "../cabinetGeometry";
import { createCabinetProductionCutlist } from "../productionCutlist";
import { geometryConstructionCandidates } from "./geometryAlias";
import { formatCutlistKey, parseCutlistKey, parsePartTreeNodeId, partTreeNodeId } from "./keys";
import type { CabinetPartIndex, PartIdentityGap, PartIdentityLink } from "./types";

export function buildCabinetPartIndex(
  cabinet: CabinetInstance,
  cabinetIndex = 1,
  roomId = "room",
): CabinetPartIndex {
  const lines = createCabinetProductionCutlist(cabinet, cabinetIndex);
  const panels = createCabinetGeometry(cabinet.config);
  const links: PartIdentityLink[] = lines.map((line) => ({
    cabinetId: cabinet.id,
    constructionKey: line.partId,
    cutlistKey: line.key,
    shopRef: line.shopRef,
    label: line.label,
    geometryNames: [],
    treePartId: partTreeNodeId(cabinet.id, line.partId, roomId),
  }));
  const byKey = new Map(links.map((link) => [link.constructionKey, link]));
  const gaps: PartIdentityGap[] = [];

  for (const panel of panels) {
    const match = geometryConstructionCandidates(panel.name)
      .map((key) => byKey.get(key))
      .find((link): link is PartIdentityLink => Boolean(link));
    if (!match) {
      gaps.push({
        kind: "geometry-without-cutlist",
        cabinetId: cabinet.id,
        ref: panel.name,
        detail: `Mesh “${panel.name}” has no current construction key.`,
      });
      continue;
    }
    if (!match.geometryNames.includes(panel.name)) match.geometryNames.push(panel.name);
  }

  for (const link of links) {
    if (link.geometryNames.length > 0) continue;
    gaps.push({
      kind: "cutlist-without-geometry",
      cabinetId: cabinet.id,
      ref: link.constructionKey,
      detail: `Cut-list part “${link.constructionKey}” has no 3D mesh name.`,
    });
  }

  for (const link of links) {
    if (link.cutlistKey !== formatCutlistKey(cabinet.id, link.constructionKey)) {
      throw new Error(`Cut-list key drifted for ${link.constructionKey}`);
    }
  }

  return { cabinetId: cabinet.id, links, gaps };
}

export function resolveFromCutlistKey(index: CabinetPartIndex, key: string) {
  const parsed = parseCutlistKey(key);
  if (!parsed || parsed.cabinetId !== index.cabinetId) return null;
  return index.links.find((link) => link.cutlistKey === key) ?? null;
}

export function resolveFromGeometryName(index: CabinetPartIndex, geometryName: string) {
  return index.links.find((link) => link.geometryNames.includes(geometryName)) ?? null;
}

export function resolveFromTreePartId(index: CabinetPartIndex, treePartId: string) {
  const parsed = parsePartTreeNodeId(treePartId);
  if (!parsed || parsed.cabinetId !== index.cabinetId) return null;
  return index.links.find((link) => link.treePartId === treePartId) ?? null;
}

export function describePartLink(link: PartIdentityLink) {
  const meshes = link.geometryNames.length ? link.geometryNames.join(", ") : "no mesh";
  return `${link.shopRef ?? link.constructionKey} · ${link.label} · ${link.cutlistKey} · ${meshes}`;
}
