import { JOB_STATUS_LABELS } from "../../domain/jobMeta";
import type { ProjectReport } from "../../domain/projectReport";
import { money } from "./helpers";

type PacketTabProps = {
  report: ProjectReport;
};

export function PacketTab({ report }: PacketTabProps) {
  const quote = report.quote;

  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Production Packet</strong>
          <span>
            {report.jobTitle} · {report.jobSubtitle}
          </span>
        </div>
        <span className={`job-status-badge status-${report.job.status}`}>
          {JOB_STATUS_LABELS[report.job.status]}
        </span>
      </header>

      <div className="report-summary-grid">
        <div className="report-card">
          <span className="report-card-label">Project #</span>
          <strong>{report.summary.projectNumber}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Customer</span>
          <strong>{report.summary.customerName}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Revision</span>
          <strong>{report.summary.revision}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Cabinets</span>
          <strong>{report.summary.cabinetCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Runs</span>
          <strong>{report.summary.runCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Part lines</span>
          <strong>{report.summary.partLineCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Workshop total</span>
          <strong>{money(report.projectCost.grandTotal)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Quote total</span>
          <strong>{money(quote.sellTotal)}</strong>
        </div>
        <div className="report-card report-card-wide">
          <span className="report-card-label">Room</span>
          <strong>{report.summary.roomSizeLabel}</strong>
        </div>
      </div>

      {report.job.notes ? (
        <section className="report-subsection">
          <h3>Job notes</h3>
          <p className="job-notes-preview">{report.job.notes}</p>
        </section>
      ) : null}

      <section className="report-subsection">
        <h3>Packet contents</h3>
        <ol className="packet-toc">
          {report.packetSections.map((section) => (
            <li key={section.id}>
              <strong>{section.title}</strong>
              <span>{section.description}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="report-cost-grid">
        <div className="report-card">
          <span className="report-card-label">Material</span>
          <strong>{money(report.projectCost.totalMaterial)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Hardware</span>
          <strong>{money(report.projectCost.totalHardware)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Labour</span>
          <strong>{money(report.projectCost.totalLabour)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Quote sell</span>
          <strong>{money(quote.sellTotal)}</strong>
        </div>
      </div>
    </div>
  );
}
