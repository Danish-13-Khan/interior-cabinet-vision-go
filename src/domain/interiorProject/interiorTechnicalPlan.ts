import { roomPlanPolygon } from "./roomGeometry";
import { roomPlanViewBounds } from "./roomPlanBounds";
import { selectOpeningsForRoom, selectWallsForRoom } from "./planTopology";
import type { InteriorProject, Point2Mm } from "./types";

export type InteriorTechnicalPlanOptions = {
  roomId?: string;
  width?: number;
  height?: number;
  title?: string;
  showDimensions?: boolean;
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]!);
}

function pointsPath(points: Point2Mm[], map: (point: Point2Mm) => Point2Mm) {
  return points.map((point, index) => {
    const mapped = map(point);
    return `${index ? "L" : "M"}${mapped.x.toFixed(2)} ${mapped.z.toFixed(2)}`;
  }).join(" ") + " Z";
}

function objectCorners(object: InteriorProject["objects"][number]): Point2Mm[] {
  const halfWidth = object.dimensions.widthMm / 2;
  const halfDepth = object.dimensions.depthMm / 2;
  const radians = object.rotation.y * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [[-halfWidth, -halfDepth], [halfWidth, -halfDepth], [halfWidth, halfDepth], [-halfWidth, halfDepth]]
    .map(([x, z]) => ({
      x: object.position.x + x! * cos - z! * sin,
      z: object.position.z + x! * sin + z! * cos,
    }));
}

/** Deterministic vector plan driven by the room's topology, not its dimensions cache. */
export function createInteriorTechnicalPlanSvg(
  project: InteriorProject,
  options: InteriorTechnicalPlanOptions = {},
): string {
  const roomId = options.roomId ?? project.activeRoomId;
  const room = project.rooms.find((item) => item.id === roomId);
  const polygon = roomPlanPolygon(project, roomId);
  if (!room || !polygon) return "";
  const width = options.width ?? 1200;
  const height = options.height ?? 800;
  const margin = Math.max(18, Math.min(width, height) * 0.08);
  const footer = Math.min(44, height * 0.12);
  const bounds = roomPlanViewBounds(project, roomId);
  const scale = Math.min(
    (width - margin * 2) / Math.max(1, bounds.widthMm),
    (height - margin * 2 - footer) / Math.max(1, bounds.depthMm),
  );
  const ox = (width - bounds.widthMm * scale) / 2;
  const oz = margin + (height - margin * 2 - footer - bounds.depthMm * scale) / 2;
  const map = (point: Point2Mm) => ({
    x: ox + (point.x - bounds.minX) * scale,
    z: oz + (point.z - bounds.minZ) * scale,
  });
  const floorPath = [polygon.outer, ...polygon.holes]
    .map((points) => pointsPath(points, map)).join(" ");
  const walls = selectWallsForRoom(project, roomId).map((wall) => {
    const start = map(wall.start); const end = map(wall.end);
    const stroke = Math.max(2, Math.min(12, wall.thicknessMm * scale));
    const x = (start.x + end.x) / 2; const z = (start.z + end.z) / 2;
    let angle = Math.atan2(end.z - start.z, end.x - start.x) * 180 / Math.PI;
    if (angle > 90 || angle < -90) angle += angle > 90 ? -180 : 180;
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
    return `<line x1="${start.x}" y1="${start.z}" x2="${end.x}" y2="${end.z}" stroke-width="${stroke.toFixed(2)}"/><text class="plan-wall-length" transform="translate(${x} ${z - 7}) rotate(${angle})">${Math.round(length)} mm</text>`;
  }).join("");
  const openings = selectOpeningsForRoom(project, roomId).flatMap((opening) => {
    const wall = project.walls.find((item) => item.id === opening.wallId);
    if (!wall) return [];
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
    if (length < 1) return [];
    const ux = (wall.end.x - wall.start.x) / length;
    const uz = (wall.end.z - wall.start.z) / length;
    const startOffset = Math.max(0, Math.min(length - opening.widthMm, opening.offsetMm));
    const endOffset = Math.min(length, startOffset + opening.widthMm);
    const start = map({ x: wall.start.x + ux * startOffset, z: wall.start.z + uz * startOffset });
    const end = map({ x: wall.start.x + ux * endOffset, z: wall.start.z + uz * endOffset });
    return [`<line class="plan-opening plan-opening-${opening.kind}" x1="${start.x}" y1="${start.z}" x2="${end.x}" y2="${end.z}"/>`];
  }).join("");
  const objects = project.objects.filter((item) => item.roomId === roomId).map((object) =>
    `<path d="${pointsPath(objectCorners(object), map)}"><title>${escapeXml(object.name)}</title></path>`,
  ).join("");
  const dimensions = options.showDimensions === false ? "" :
    `<g class="plan-dimensions"><text x="${width / 2}" y="${Math.max(12, oz - 9)}">${Math.round(bounds.widthMm)} mm</text><text transform="translate(${Math.max(12, ox - 9)} ${oz + bounds.depthMm * scale / 2}) rotate(-90)">${Math.round(bounds.depthMm)} mm</text></g>`;
  const title = escapeXml(options.title ?? `${project.name} — ${room.name}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="interior-technical-plan" data-room-id="${escapeXml(roomId)}"><rect width="${width}" height="${height}" fill="#eef2f3"/><path class="plan-floor" d="${floorPath}" fill-rule="evenodd"/><g class="plan-walls">${walls}</g><g class="plan-openings">${openings}</g><g class="plan-objects">${objects}</g>${dimensions}<text class="plan-title" x="${margin}" y="${height - 14}">${title}</text><style>.plan-floor{fill:#fff;stroke:#263940;stroke-width:1}.plan-walls{stroke:#263940;stroke-linecap:square}.plan-wall-length{fill:#32444e;stroke:none;font:500 9px sans-serif;text-anchor:middle}.plan-opening{stroke:#eef2f3;stroke-width:7;stroke-linecap:butt}.plan-opening-door{stroke:#b76d3a}.plan-opening-window{stroke:#4f8fa6}.plan-objects{fill:#c8b087;stroke:#40515a;stroke-width:1.5}.plan-dimensions,.plan-title{fill:#32444e;font:600 11px sans-serif;text-anchor:middle}.plan-title{text-anchor:start}</style></svg>`;
}
