import type { ApartmentTemplateSpec } from "./types";
import { ONE_BHK_SHELL_SPEC } from "./specs/oneBhkShell";
import { STUDIO_SHELL_SPEC } from "./specs/studioShell";
import { THREE_BHK_SHELL_SPEC } from "./specs/threeBhkShell";
import { TWO_BHK_SHELL_SPEC } from "./specs/twoBhkShell";

export type ApartmentTemplateCard = {
  id: ApartmentTemplateSpec["id"];
  name: string;
  description: string;
  /** Carpet area from shell centreline footprint (D6). */
  areaM2: number;
  roomCount: number;
};

function card(spec: ApartmentTemplateSpec): ApartmentTemplateCard {
  const areaM2 = Math.round((spec.shell.widthMm * spec.shell.depthMm) / 1e6);
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    areaM2,
    roomCount: spec.rooms.length,
  };
}

/** Project-home / marketing cards for the four product apartments. */
export const APARTMENT_TEMPLATE_CARDS: readonly ApartmentTemplateCard[] = [
  card(STUDIO_SHELL_SPEC),
  card(ONE_BHK_SHELL_SPEC),
  card(TWO_BHK_SHELL_SPEC),
  card(THREE_BHK_SHELL_SPEC),
];
