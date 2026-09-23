import type { InteriorProject } from "../../domain/interiorProject";
import { readProposalCommercial } from "../../domain/livingRoom/proposal";
import { formatQuoteMoney } from "../../domain/quoteSettings";

export function StudioDocumentsPage({ project }: { project: InteriorProject | null }) {
  if (!project) {
    return <p className="studio-state" data-testid="studio-documents-empty">Open a project to see issued quotes.</p>;
  }
  const commercial = readProposalCommercial(project);
  const release = commercial.surface.proposalRelease;
  return (
    <div className="studio-page" data-testid="studio-documents">
      <h2>Documents</h2>
      {release ? (
        <p className="studio-card">Proposal released · Rev {release.revision} · snapshot {release.snapshotId}</p>
      ) : (
        <p className="studio-state">No proposal PDF has been released for this revision.</p>
      )}
      {commercial.quoteHistory.length === 0 ? (
        <p className="studio-state">No frozen quote yet. Freeze one from Quote & proposal.</p>
      ) : (
        <table className="studio-table">
          <thead><tr><th>Revision</th><th>Quoted</th><th>Sell total</th><th>Snapshot</th></tr></thead>
          <tbody>
            {commercial.quoteHistory.map((snap, index) => (
              <tr key={snap.id}>
                <td>{snap.revision}{index === 0 ? " · current issued" : ""}</td>
                <td>{snap.quotedAt}</td>
                <td>{formatQuoteMoney(snap.sellTotal, snap.currencyLabel ?? "INR")}</td>
                <td>{snap.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
