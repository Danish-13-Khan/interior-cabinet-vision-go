import type { GeminiFloorProposal } from "./proposalTypes";
import { SAMPLE_L_ROOM_CM, SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";
import { SAMPLE_MESSY_KITCHEN_MM } from "./messySampleProposal";

export function fixtureById(id: string): GeminiFloorProposal {
  if (id === "l-cm") return SAMPLE_L_ROOM_CM;
  if (id === "messy-mm") return SAMPLE_MESSY_KITCHEN_MM;
  return SAMPLE_RECT_KITCHEN_MM;
}
