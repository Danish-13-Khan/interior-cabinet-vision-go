import { cabinetProjectFromInteriorProject } from "../../interiorProject";
import type { InteriorProject } from "../../interiorProject";
import { hashString } from "../sceneCompilerBounds";
import { readProposalCommercial } from "./commercialState";

/** JSON-stable: omitted keys match file reload, so a freeze survives save/open. */
function fingerprintStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(fingerprintStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .filter((key) => object[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${fingerprintStringify(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function selectedCameraIds(document: InteriorProject) {
  const { surface } = readProposalCommercial(document);
  if (surface.selectedViewCameraIds.length) return new Set(surface.selectedViewCameraIds);
  return new Set(document.renderSettings.packageCameraBookmarks.map((view) => view.cameraId));
}

export function createQuoteDesignFingerprint(document: InteriorProject): string {
  const commercial = readProposalCommercial(document);
  const { project } = cabinetProjectFromInteriorProject(document);
  const cameras = selectedCameraIds(document);
  return hashString(fingerprintStringify({
    cabinets: project.cabinets
      .map((cabinet) => ({
        id: cabinet.id,
        name: cabinet.name,
        type: cabinet.config.type,
        family: cabinet.config.familyId ?? "",
        catalog: cabinet.config.catalogItemId ?? "",
        sku: cabinet.config.sku ?? "",
        dims: cabinet.config.dimensions,
        shelves: cabinet.config.shelfCount,
        doors: cabinet.config.hasDoors,
        drawers: cabinet.config.drawerCount ?? 0,
        toe: [cabinet.config.toeKickHeight, cabinet.config.toeKickInset],
        ends: [cabinet.config.leftEndPanel ?? false, cabinet.config.rightEndPanel ?? false],
        finish: cabinet.config.buildRules ?? {},
        composition: cabinet.config.composition ?? null,
        construction: cabinet.config.construction ?? null,
        hardware: cabinet.config.hardware ?? null,
        placement: cabinet.placement,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    rooms: document.rooms
      .map((room) => ({ id: room.id, dims: room.dimensions, wall: room.wallThicknessMm }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    walls: document.walls
      .map((wall) => ({
        id: wall.id,
        start: wall.start,
        end: wall.end,
        h: wall.heightMm,
        t: wall.thicknessMm,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    objects: document.objects
      .map((object) => ({
        id: object.id,
        kind: object.kind,
        pos: object.position,
        rot: object.rotation,
        dims: object.dimensions,
        catalog: object.catalogItemId,
        params: object.parameters,
        materials: object.materialSlots,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    cameras: document.cameras
      .filter((camera) => cameras.has(camera.id))
      .map((camera) => ({
        id: camera.id,
        pos: camera.position,
        target: camera.target,
        fov: camera.fieldOfViewDegrees,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    customerName: commercial.job.customerName,
    projectNumber: commercial.job.projectNumber,
    revision: commercial.job.revision,
    validityDays: commercial.quote.validityDays,
    markup: commercial.quote.markupPercent,
    tax: commercial.quote.taxPercent,
    discount: commercial.quote.discountPercent,
    finish: commercial.quote.finishPremiumPercent,
    labour: commercial.quote.labourAllowance,
    inclusions: commercial.quote.inclusions,
    exclusions: commercial.quote.exclusions,
    currency: commercial.quote.currencyLabel,
    taxLabel: commercial.quote.taxLabel,
    priceDetail: commercial.quote.priceDetail,
  }));
}
