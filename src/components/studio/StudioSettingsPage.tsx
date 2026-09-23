import type { InteriorProject } from "../../domain/interiorProject";
import type { QuoteSettings } from "../../domain/quoteSettings";

export function StudioSettingsPage(props: {
  project: InteriorProject | null;
  quote: QuoteSettings | null;
  onQuote: (patch: Partial<QuoteSettings>) => void;
}) {
  if (!props.project || !props.quote) {
    return <p className="studio-state">Open a project to edit commercial settings.</p>;
  }
  const quote = props.quote;
  return (
    <div className="studio-page" data-testid="studio-settings">
      <h2>Settings</h2>
      <p>These fields write the same quote settings used by freeze and the proposal.</p>
      <label className="studio-field">Markup %
        <input type="number" min={0} max={100} value={quote.markupPercent} onChange={(event) => props.onQuote({ markupPercent: Number(event.target.value) })} />
      </label>
      <label className="studio-field">{quote.taxLabel} %
        <input type="number" min={0} max={40} value={quote.taxPercent} onChange={(event) => props.onQuote({ taxPercent: Number(event.target.value) })} />
      </label>
      <label className="studio-field">Validity days
        <input type="number" min={1} max={365} value={quote.validityDays} onChange={(event) => props.onQuote({ validityDays: Number(event.target.value) })} />
      </label>
      <p className="studio-badge is-saved">Saved with the project when you leave the field.</p>
    </div>
  );
}
