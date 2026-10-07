import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";

type Proposal = ReturnType<typeof useProposalWorkflow>;

/**
 * Phase 3: the pages "Create Proposal" would save, rendered in the app first.
 * A draft previews too, so a wrong frame is seen before the quote is frozen.
 */
export function InteriorsProposalPreview({ proposal, hidden }: { proposal: Proposal; hidden: boolean }) {
  if (hidden) return null;
  const { preview } = proposal;
  const ready = Boolean(proposal.gate?.ready);
  return (
    <section className="proposal-review-fields interiors-proposal-preview" data-testid="interiors-proposal-preview">
      <strong>Preview the proposal</strong>
      <button
        type="button"
        data-testid="interiors-proposal-preview-render"
        title="Renders every page of the PDF that Create Proposal would save; nothing is saved or released"
        onClick={() => void proposal.previewProposal()}
        disabled={preview.busy || proposal.busy}
      >
        {preview.busy ? "Rendering pages…" : preview.pages.length ? "Refresh preview" : "Preview proposal"}
      </button>
      {!ready && !preview.busy ? (
        <small>Draft preview: the gate still blocks Create Proposal.</small>
      ) : null}
      {preview.error ? <p className="interiors-present-photo-error">{preview.error}</p> : null}
      {preview.pages.length ? (
        <ol className="interiors-proposal-preview-pages" aria-label="Proposal pages">
          {preview.pages.map((page) => (
            <li key={page.index}>
              <img src={page.dataUrl} width={page.width} height={page.height} alt={`Page ${page.index}: ${page.label}`} />
              <small>{page.index} · {page.label}</small>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
