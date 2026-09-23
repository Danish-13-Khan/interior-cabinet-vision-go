import { useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import { useAccountPlan } from "../../hooks/useAccountPlan";
import { seatHasPermission } from "../../domain/company/permissions";
import { canViewPaymentRecords } from "../../domain/studio/paymentAccess";
import { paymentDashboard } from "../../domain/studio/paymentDashboard";
import { StudioPaymentsSummary } from "../studio/StudioPaymentsSummary";
import { readPaymentLedger, persistPaymentLedger, currentObligationForProject, computeDocumentBalances, recordPayment, voidPayment, refundPayment, correctPayment, reallocatePayment, setPaymentSchedule, markDocumentAccepted, createInvoiceAndRollForward, assertPaymentMutation, type PaymentLedgerState } from "../../domain/paymentLedger";

export function InteriorPaymentsPanel({ project }: { project: InteriorProject }) {
  const account = useAccountPlan();
  const [ledger, setLedger] = useState(readPaymentLedger);
  const [amount, setAmount] = useState(""), [reason, setReason] = useState(""), [due, setDue] = useState(""), [label, setLabel] = useState("Instalment"), [message, setMessage] = useState("");
  const seat = account.account?.organization?.seats.find(s => s.email.toLowerCase() === account.account?.email.toLowerCase());
  const gate = { entitlements: account.entitlements, seat };
  const company = account.entitlements.canUseCompanyControls;
  const canView = canViewPaymentRecords({ entitlements: account.entitlements, seat });
  const canCorrect = canView && (!company || Boolean(seat && seatHasPermission(seat, "payments:correct")));
  const doc = currentObligationForProject(ledger, project.id);
  const balance = doc ? computeDocumentBalances(ledger, doc.id) : null;
  const actor = account.account?.email ?? "";
  const stamp = { actor, reason };
  function mutate(fn: (state: PaymentLedgerState) => PaymentLedgerState, correct = false) {
    try {
      if (!actor || company && !seat) throw new Error("A current account and company seat are required.");
      assertPaymentMutation(gate, correct ? "correct" : "write");
      const next = fn(readPaymentLedger());
      persistPaymentLedger(next); setLedger(next); setMessage("Record saved locally.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save record."); }
  }
  if (!canView) return <section><h3>Payment records</h3><p>Professional and Company include payment records. Company also requires a seat with payment access.</p></section>;
  const payments = ledger.payments.filter(p => p.projectId === project.id);
  const docIds = new Set(ledger.documents.filter(d => d.projectId === project.id).map(d => d.id));
  const schedule = ledger.schedules.find(s => s.documentId === doc?.id);
  return <section><StudioPaymentsSummary summary={canView ? paymentDashboard(ledger, project.id) : null} canCorrect={canCorrect} /><h3>Client payment records</h3><p>Records only: no money is collected here. All records are stored on this device. Receipts apply to the oldest due instalments first. Overdue excludes future instalments.</p>
    <button type="button" onClick={() => setLedger(readPaymentLedger())}>Refresh records</button>
    <p role="status">{message}</p>
    {!doc || !balance ? <p>Freeze a quote in Present to create a commercial obligation for this project.</p> : <>
      <h4>{doc.kind === "invoice" ? "Invoice" : "Quote"} · {doc.revisionLabel} · {doc.threadStatus}</h4>
      <p>{doc.currencyLabel} · Total {balance.documentTotal.toLocaleString()} · Received {balance.received.toLocaleString()} · Outstanding {balance.outstanding.toLocaleString()} · Overdue {balance.overdue.toLocaleString()}</p>
      {doc.kind === "frozen_quote" && <div className="ipt-fields"><button type="button" disabled={doc.threadStatus === "accepted"} onClick={() => mutate(s => markDocumentAccepted(s, doc.id, stamp))}>Record client acceptance</button><button type="button" onClick={() => mutate(s => createInvoiceAndRollForward(s, { quoteDocumentId: doc.id, stamp }).state)}>Create invoice record and roll payments forward</button></div>}
      <div className="ipt-fields"><label>Amount / signed correction<input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label><label>Note / mandatory change reason<input value={reason} onChange={e => setReason(e.target.value)} /></label><button type="button" onClick={() => mutate(s => recordPayment(s, { documentId: doc.id, amount: Number(amount), actor, note: reason }, gate).state)}>Record receipt</button></div>
      <h4>Payment schedule</h4>{schedule?.instalments.map(i => <p key={i.id}>{i.label} · {i.amount} · Due {i.dueDate}</p>)}
      <form className="ipt-fields" onSubmit={e => { e.preventDefault(); mutate(s => { if (Number(amount) <= 0) throw new Error("Enter a positive instalment amount."); return setPaymentSchedule(s, { documentId: doc.id, instalments: [...(s.schedules.find(v => v.documentId === doc.id)?.instalments ?? []), { label, amount: Number(amount), dueDate: due }], stamp }).state; }); }}><label>Instalment label<input required value={label} onChange={e => setLabel(e.target.value)} /></label><label>Due date<input required type="date" value={due} onChange={e => setDue(e.target.value)} /></label><button>Add instalment using amount above</button></form>
    </>}
    <h4>Full project payment history</h4><div className="ipt-table"><table><thead><tr><th>Date / actor</th><th>Kind / status</th><th>Amount</th><th>Note</th><th>Actions using amount and reason above</th></tr></thead><tbody>{payments.map(p => <tr key={p.id}><td>{p.createdAt}<small>{p.actor}</small></td><td>{p.kind} · {p.status}<small>{p.documentId === doc?.id ? "Current obligation" : "Historical obligation"}</small></td><td>{p.amount}</td><td>{p.reason ?? p.note}</td><td>{p.status === "recorded" && <div className="ipt-fields"><button type="button" onClick={() => mutate(s => voidPayment(s, p.id, stamp, gate), true)}>Void</button>{p.documentId === doc?.id ? <><button type="button" onClick={() => mutate(s => refundPayment(s, { linkedPaymentId: p.id, amount: Number(amount), stamp }, gate).state, true)}>Refund</button><button type="button" onClick={() => mutate(s => correctPayment(s, { linkedPaymentId: p.id, adjustment: Number(amount), stamp }, gate).state, true)}>Correct</button></> : doc && <button type="button" onClick={() => mutate(s => reallocatePayment(s, { paymentId: p.id, toDocumentId: doc.id, stamp }, gate), true)}>Move to current obligation</button>}</div>}</td></tr>)}</tbody></table></div>
    <details><summary>Complete audit trail</summary>{ledger.audit.filter(event => docIds.has(event.documentId ?? "")).map(event => <p key={event.id}>{event.at} · {event.actor} · {event.action} · {event.reason ?? event.detail}</p>)}</details>
  </section>;
}
