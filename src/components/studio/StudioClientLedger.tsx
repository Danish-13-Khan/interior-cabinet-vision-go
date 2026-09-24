import { useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import { readProposalCommercial } from "../../domain/livingRoom/proposal/commercialState";
import { readPaymentLedger } from "../../domain/paymentLedger";
import { paymentDashboard } from "../../domain/studio/paymentDashboard";
import { InteriorPaymentsPanel } from "../livingRoomPlan/InteriorPaymentsPanel";

export function StudioClientLedger(props: { project: InteriorProject }) {
  const [ledger, setLedger] = useState(readPaymentLedger);
  const summary = paymentDashboard(ledger, props.project.id);
  const job = readProposalCommercial(props.project).job;
  const documents = ledger.documents.filter((doc) => doc.projectId === props.project.id);
  const docIds = new Set(documents.map((doc) => doc.id));
  const payments = ledger.payments.filter((payment) => payment.projectId === props.project.id).slice(-4).reverse();
  const activity = ledger.audit.filter((event) => event.documentId && docIds.has(event.documentId)).slice(-4).reverse();
  const money = (amount: number) => `${summary?.currency ?? ""} ${amount.toLocaleString()}`.trim();
  return (
    <div className="studio-ledger" data-testid="studio-client-ledger">
      <header className="studio-landing-head">
        <div>
          <p>Clients / {job.customerName || "Client"}</p>
          <h2>Client & payment records</h2>
        </div>
        <button type="button" className="studio-btn" onClick={() => setLedger(readPaymentLedger())}>Refresh</button>
      </header>
      <div className="studio-stat-grid">
        <article><small>Project value</small><strong>{summary ? money(summary.total) : "—"}</strong><span>{props.project.name}</span></article>
        <article className="is-paid"><small>Paid to date</small><strong>{summary ? money(summary.received) : "—"}</strong><span>Recorded receipts</span></article>
        <article className={summary && summary.outstanding > 0 ? "is-due" : ""}><small>Outstanding</small><strong>{summary ? money(summary.outstanding) : "—"}</strong><span>{summary ? `Rev ${summary.revision}` : "No frozen quote"}</span></article>
        <article><small>Overdue</small><strong>{summary ? money(summary.overdue) : "—"}</strong><span>{summary && summary.overdue > 0 ? "Past due" : "None past due"}</span></article>
      </div>
      <div className="studio-ledger-grid">
        <section className="studio-card">
          <h3>Payment schedule</h3>
          {!summary || summary.instalments.length === 0 ? <p>No instalments yet. Freeze a quote, then add a schedule below.</p> : null}
          {summary?.instalments.map((item) => (
            <p key={item.id}><span>{item.label}</span><span>{money(item.amount)}</span><small>Due {item.dueDate}</small></p>
          ))}
        </section>
        <section className="studio-card">
          <h3>Recent payments</h3>
          {payments.length === 0 ? <p>No receipts recorded.</p> : null}
          {payments.map((payment) => (
            <p key={payment.id}><span>{payment.kind} · {payment.status}</span><span>{money(payment.amount)}</span><small>{payment.createdAt.slice(0, 10)} · {payment.actor}</small></p>
          ))}
        </section>
        <aside className="studio-card">
          <h3>{job.status === "approved" || job.status === "production" ? "Ready for engineering" : "Design in progress"}</h3>
          <p>Design rev {job.revision}. {job.status === "production" ? "Released to production." : "Approval and a frozen quote unlock production release."}</p>
          <h3>Milestones</h3>
          <p>Design · {job.status}</p>
          <p>Quote · {summary ? `Rev ${summary.revision}` : "Not issued"}</p>
          <p>Production · {job.status === "production" ? "Released" : "Waiting"}</p>
        </aside>
      </div>
      <section className="studio-card">
        <h3>Quote & invoice history</h3>
        {documents.length === 0 ? <p>No commercial documents for this project.</p> : null}
        <table className="studio-table">
          <thead><tr><th>Document</th><th>Updated</th><th>Status</th></tr></thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}><td>{doc.kind} · {doc.revisionLabel}</td><td>{doc.createdAt.slice(0, 10)}</td><td>{doc.threadStatus}</td></tr>
            ))}
          </tbody>
        </table>
        {activity.map((event) => <small key={event.id}>{event.at.slice(0, 10)} · {event.actor} · {event.action}</small>)}
      </section>
      <details className="studio-card">
        <summary>Record payment</summary>
        <InteriorPaymentsPanel project={props.project} />
      </details>
    </div>
  );
}
