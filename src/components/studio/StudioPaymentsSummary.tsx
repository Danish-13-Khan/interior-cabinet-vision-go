import type { PaymentDashboard } from "../../domain/studio/paymentDashboard";

export function StudioPaymentsSummary(props: { summary: PaymentDashboard | null; canCorrect: boolean }) {
  if (!props.summary) {
    return <p className="studio-state">Freeze a quote to open balances and instalments for this project.</p>;
  }
  const summary = props.summary;
  return (
    <section className="studio-card" data-testid="studio-payments-summary">
      <h3>Rev {summary.revision} · {summary.currency}</h3>
      <p>Total {summary.total.toLocaleString()} · Received {summary.received.toLocaleString()} · Outstanding {summary.outstanding.toLocaleString()} · Overdue {summary.overdue.toLocaleString()}</p>
      {summary.instalments.length === 0 ? <p>No instalments scheduled.</p> : (
        <ul>
          {summary.instalments.map((item) => (
            <li key={item.id}>{item.label} · {item.amount.toLocaleString()} · due {item.dueDate}</li>
          ))}
        </ul>
      )}
      <p>{props.canCorrect ? "Corrections are allowed for this seat." : "Corrections need a seat with payment change permission."}</p>
    </section>
  );
}
