import type {
  InteriorObjectEntity,
  InteriorProject,
  Point2Mm,
} from "../../interiorProject";

export type StillJobMillworkRef = {
  id: string;
  category: string;
  kind: string;
  size: { w: number; d: number; h: number };
};

export type StillJobOpeningRef = {
  id: string;
  wallId: string;
  kind: string;
  offsetMm: number;
  widthMm: number;
  heightMm: number;
  sillHeightMm: number;
};

export type StillJobWallRef = {
  id: string;
  start: Point2Mm;
  end: Point2Mm;
};

const MILLWORK_CATEGORIES = new Set(["media-unit", "storage"]);

export function isMillworkObject(object: InteriorObjectEntity) {
  return object.kind === "cabinet" || MILLWORK_CATEGORIES.has(object.category);
}

export function millworkRefsFromProject(project: InteriorProject): StillJobMillworkRef[] {
  return project.objects.filter(isMillworkObject).map((object) => ({
    id: object.id,
    category: object.category,
    kind: object.kind,
    size: {
      w: object.dimensions.widthMm,
      d: object.dimensions.depthMm,
      h: object.dimensions.heightMm,
    },
  }));
}

export function openingRefsFromProject(project: InteriorProject): StillJobOpeningRef[] {
  return project.openings.map((opening) => ({
    id: opening.id,
    wallId: opening.wallId,
    kind: opening.kind,
    offsetMm: opening.offsetMm,
    widthMm: opening.widthMm,
    heightMm: opening.heightMm,
    sillHeightMm: opening.sillHeightMm,
  }));
}

export function wallRefsFromProject(project: InteriorProject): StillJobWallRef[] {
  return project.walls.map((wall) => ({
    id: wall.id,
    start: { ...wall.start },
    end: { ...wall.end },
  }));
}
