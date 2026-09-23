import { readClientHistory } from "../../domain/saas/clientHistoryStore";
import { summarizeClientHistory } from "../../domain/saas/clientHistory";
import { readPaymentLedger } from "../../domain/paymentLedger";
import { canViewPaymentRecords } from "../../domain/studio/paymentAccess";
import type { InteriorProject } from "../../domain/interiorProject";
import { useAccountPlan } from "../../hooks/useAccountPlan";
import { InteriorClientPanel } from "../livingRoomPlan/InteriorClientPanel";

export function StudioClientsPage(props: {
  project: InteriorProject | null;
  onPatchDocument: (update: (project: InteriorProject) => InteriorProject) => void;
}) {
  const account = useAccountPlan();
  const seat = account.account?.organization?.seats.find(
    (item) => item.email.toLowerCase() === account.account?.email.toLowerCase(),
  );
  const canViewHistory = account.entitlements.canUseClientHistory;
  const canViewPayments = canViewPaymentRecords({ entitlements: account.entitlements, seat });
  const clients = canViewHistory ? readClientHistory() : [];
  const ledger = canViewHistory && canViewPayments ? readPaymentLedger() : null;
  return (
    <div className="studio-page" data-testid="studio-clients">
      <h2>Clients</h2>
      <p>Everyone saved on this device, with the projects linked to them.</p>
      {!canViewHistory ? <p className="studio-state">Client history needs a plan that includes it.</p> : null}
      {canViewHistory && clients.length === 0 ? <p className="studio-state">No clients yet. Open a project to add one.</p> : null}
      <div className="studio-project-list">
        {clients.map((client) => {
          const projects = new Set([client.projectId, ...client.projectIds].filter(Boolean)).size;
          const history = ledger ? summarizeClientHistory(client, ledger) : null;
          return (
            <article key={client.id} className="studio-card" data-testid="studio-client-card">
              <strong>{client.contact.name}</strong>
              <p>{client.contact.email || "No email"} · {client.contact.phone || "No phone"}</p>
              <p>
                {projects} projects
                {history ? ` · ${history.paymentCount} payments · Outstanding ${history.outstanding}` : " · Payment balances need payment access."}
              </p>
            </article>
          );
        })}
      </div>
      {props.project ? (
        <InteriorClientPanel project={props.project} onPatchDocument={props.onPatchDocument} />
      ) : (
        <p className="studio-state">Open a project to edit or link its client.</p>
      )}
    </div>
  );
}
