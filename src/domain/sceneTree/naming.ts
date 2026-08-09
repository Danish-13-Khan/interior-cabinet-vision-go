import {
  familyGlyph,
  familyShort,
  familyTerm,
  familyTone,
  formatCabinetMark,
  formatOpeningMark,
  openingContentTerm,
  openingGlyph,
  wallGlyph,
} from "../shopTerms";
import type {
  CabinetInstance,
  CabinetType,
} from "../cabinetDimensions";
import { formatRunDraftLabel, formatRunSideLabel } from "../runDrafting";
import type { CabinetRun, CabinetRunSide } from "../cabinetLibrary";
import type { OpeningLeaf } from "../cabinetOpeningStructure";

/** Compact family glyphs for the object tree (CAD-style marks). */
export const cabinetFamilyIcons: Record<CabinetType, string> = {
  base: familyGlyph("base"),
  wall: familyGlyph("wall"),
  tall: familyGlyph("tall"),
  drawer: familyGlyph("drawer"),
  sink: familyGlyph("sink"),
  corner: familyGlyph("corner"),
  "open-shelf": familyGlyph("open-shelf"),
  almirah: familyGlyph("almirah"),
  table: familyGlyph("table"),
  chair: familyGlyph("chair"),
  sofa: familyGlyph("sofa"),
  mirror: familyGlyph("mirror"),
};

export const cabinetFamilyTones: Record<CabinetType, string> = {
  base: familyTone("base"),
  wall: familyTone("wall"),
  tall: familyTone("tall"),
  drawer: familyTone("drawer"),
  sink: familyTone("sink"),
  corner: familyTone("corner"),
  "open-shelf": familyTone("open-shelf"),
  almirah: familyTone("almirah"),
  table: familyTone("table"),
  chair: familyTone("chair"),
  sofa: familyTone("sofa"),
  mirror: familyTone("mirror"),
};

export function cabinetFamilyIcon(type: CabinetType) {
  return familyGlyph(type);
}

export function cabinetFamilyTone(type: CabinetType) {
  return familyTone(type);
}

export function formatCabinetStructuredName(
  cabinet: CabinetInstance,
  markIndex: number,
) {
  const mark = formatCabinetMark(markIndex);
  const family = shortFamilyLabel(cabinet.config.type);
  const { width, height } = cabinet.config.dimensions;
  return {
    mark,
    label: `${mark} · ${cabinet.name}`,
    detail: `${family} · ${Math.round(width)}×${Math.round(height)}`,
    title: `${mark} · ${cabinet.name} · ${familyTerm(cabinet.config.type)} · ${Math.round(width)}×${Math.round(height)}×${Math.round(cabinet.config.dimensions.depth)}`,
  };
}

export function shortFamilyLabel(type: CabinetType) {
  return familyShort(type);
}

export function formatWallTreeLabel(side: CabinetRunSide) {
  return formatRunSideLabel(side);
}

export function formatRunTreeLabel(run: CabinetRun, index: number) {
  return formatRunDraftLabel(run, index);
}

export function formatOpeningStructuredName(leaf: OpeningLeaf, index: number) {
  const code = formatOpeningMark(leaf.contentType, index);
  return {
    icon: openingGlyph(leaf.contentType),
    label: `${code} · ${leaf.label}`,
    detail: openingContentTerm(leaf.contentType),
  };
}

export function wallIcon(side: CabinetRunSide) {
  return wallGlyph(side);
}
