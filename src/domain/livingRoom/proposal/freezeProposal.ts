import type { InteriorProject } from "../../interiorProject";
import { appendFrozenQuote } from "./commercialState";
import { freezeLiveQuote } from "./liveQuote";
import { buildProposalClientPayload } from "./proposalClientPayload";

export function freezeProposal(
  document: InteriorProject,
  now = new Date().toISOString(),
): InteriorProject {
  const snapshot = freezeLiveQuote(document, now);
  return appendFrozenQuote(document, snapshot, buildProposalClientPayload(document, snapshot.id));
}
