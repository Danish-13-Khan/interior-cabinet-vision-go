import { useState } from "react";
import type { ProjectToolsProps } from "./InteriorProjectTools";
import { useAccountPlan } from "../../hooks/useAccountPlan";
import { readClientHistory, upsertClientHistory } from "../../domain/saas/clientHistoryStore";
import { createClientHistoryRecord, linkProjectToClient, summarizeClientHistory } from "../../domain/saas/clientHistory";
import { readPaymentLedger } from "../../domain/paymentLedger";
import { canViewPaymentRecords } from "../../domain/studio/paymentAccess";
import { patchProposalJob, readProposalCommercial } from "../../domain/livingRoom/proposal/commercialState";

export function InteriorClientPanel({ project, onPatchDocument }: ProjectToolsProps) {
  const account = useAccountPlan();
  const entitlements = account.entitlements;
  const seat = account.account?.organization?.seats.find((item) => item.email.toLowerCase() === account.account?.email.toLowerCase());
  const canViewPayments = canViewPaymentRecords({ entitlements, seat });
  const [clients, setClients] = useState(readClientHistory);
  const linked = clients.find(c => c.projectIds.includes(project.id));
  const [name, setName] = useState(linked?.contact.name ?? readProposalCommercial(project).job.customerName);
  const [email, setEmail] = useState(linked?.contact.email ?? ""), [phone, setPhone] = useState(linked?.contact.phone ?? ""), [message, setMessage] = useState("");
  function saveClient(id?: string) {
    try {
      const existing = id ? readClientHistory().find(c => c.id === id) : linked;
      const record = existing && id ? linkProjectToClient(existing, project.id) : createClientHistoryRecord({ ...existing, id: existing?.id ?? crypto.randomUUID(), contact: { name: name.trim(), email, phone }, projectId: project.id, projectIds: existing?.projectIds ?? [project.id] });
      if (readClientHistory().some(c => c.id !== record.id && c.projectIds.includes(project.id))) throw new Error("This project already has a linked client. Edit their details here.");
      setClients(upsertClientHistory(record)); setName(record.contact.name); setEmail(record.contact.email ?? ""); setPhone(record.contact.phone ?? "");
      onPatchDocument(p => patchProposalJob(p, { customerName: record.contact.name })); setMessage("Client saved locally and linked to this project.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save client."); }
  }
  return <section><h3>Project client</h3><p>Contact details stay on this device. The client name is also used on the proposal.</p><form onSubmit={e => { e.preventDefault(); saveClient(); }}><fieldset disabled={!entitlements.canUseBasicClient}><div className="ipt-fields"><label>Client name<input required value={name} onChange={e => setName(e.target.value)} /></label><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Phone<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label><button>Save client</button></div></fieldset></form><p role="status">{message}</p>
    {entitlements.canUseClientHistory && <><h4>Consolidated client history</h4>{clients.map(c => { const history = canViewPayments ? summarizeClientHistory(c, readPaymentLedger()) : null; const projects = new Set([c.projectId, ...c.projectIds].filter(Boolean)).size; return <article key={c.id}><strong>{c.contact.name}</strong><p>{projects} projects{history ? ` · ${history.paymentCount} payment records · Outstanding ${history.outstanding} · Overdue ${history.overdue}` : " · Payment balances need payment access."}</p>{!linked && <button type="button" onClick={() => saveClient(c.id)}>Link this project</button>}</article>; })}</>}
  </section>;
}
