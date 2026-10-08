import { useEffect, useRef, useState } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import { buildProposalDocument, exportInteriorProposalPdf } from "../domain/livingRoom/proposal";
import { proposalUnprintableFields } from "../domain/livingRoom/proposal/proposalPdfFont";
import type { ProposalPreviewPage } from "../domain/livingRoom/proposal/proposalPreview";
import type { ProposalViewFrame } from "../domain/livingRoom/proposal";
import { getErrorMessage } from "../utils/errors";

export type ProposalPreviewState = {
  pages: ProposalPreviewPage[];
  busy: boolean;
  error: string | null;
  /** Fields with characters the embedded font cannot print; they are dropped on the page. */
  warnings: string[];
};

const EMPTY: ProposalPreviewState = { pages: [], busy: false, error: null, warnings: [] };

/**
 * Phase 3: render the pages "Create Proposal" would save, without saving or
 * recording a release. A preview shows one revision of the design and its
 * frames: any change clears it, and a render that started before the change
 * is dropped when it finishes.
 */
export function useProposalPreview(args: {
  project: InteriorProject | null;
  viewFrames: ProposalViewFrame[];
  staleOverride: boolean;
}) {
  const [preview, setPreview] = useState<ProposalPreviewState>(EMPTY);
  const renderSeq = useRef(0);

  useEffect(() => {
    renderSeq.current += 1;
    setPreview((current) => (current.pages.length || current.busy ? EMPTY : current));
  }, [args.project, args.viewFrames]);

  async function previewProposal() {
    if (!args.project) return;
    const seq = ++renderSeq.current;
    setPreview({ ...EMPTY, busy: true });
    try {
      const proposalDoc = buildProposalDocument(args.project, { staleOverride: args.staleOverride });
      const blob = await exportInteriorProposalPdf(args.project, args.viewFrames, { staleOverride: args.staleOverride });
      const { renderProposalPreview } = await import("../domain/livingRoom/proposal/proposalPreview");
      const pages = await renderProposalPreview(blob, proposalDoc);
      if (seq !== renderSeq.current) return;
      setPreview({ pages, busy: false, error: null, warnings: proposalUnprintableFields(proposalDoc) });
    } catch (error) {
      if (seq !== renderSeq.current) return;
      setPreview({ ...EMPTY, error: `Preview failed: ${getErrorMessage(error)}` });
    }
  }

  return { preview, previewProposal };
}
