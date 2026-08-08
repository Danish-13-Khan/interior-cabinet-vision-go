import type { ProjectReport } from "../../domain/projectReport";
import type { QuoteSettings } from "../../domain/quoteSettings";
import { formatQuoteMoney } from "../../domain/quoteSettings";
import { money } from "./helpers";

type QuoteTabProps = {
  report: ProjectReport;
  quoteSettings: QuoteSettings;
  onQuoteChange: (next: QuoteSettings) => void;
  onFreezeQuote?: () => void;
  onSelectCabinet?: (cabinetId: string) => void;
};

export function QuoteTab({
  report,
  quoteSettings,
  onQuoteChange,
  onFreezeQuote,
  onSelectCabinet,
}: QuoteTabProps) {
  const quote = report.quote;
  const validUntilLabel = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString()
    : "—";

  function patchQuote(patch: Partial<QuoteSettings>) {
    onQuoteChange({ ...quoteSettings, ...patch });
  }

  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Quote / Estimate</strong>
          <span>
            Rev {report.summary.revision} · valid until {validUntilLabel} ·{" "}
            {quoteSettings.currencyLabel}
          </span>
        </div>
        <div className="quote-header-actions">
          <strong>{formatQuoteMoney(quote.sellTotal, quoteSettings.currencyLabel)}</strong>
          {onFreezeQuote ? (
            <button type="button" className="tb-btn tb-accent" onClick={onFreezeQuote}>
              Freeze for revision
            </button>
          ) : null}
        </div>
      </header>

      <div className="costing-controls quote-controls">
        <label>
          Markup %
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={quoteSettings.markupPercent}
            onChange={(event) =>
              patchQuote({ markupPercent: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          Tax %
          <input
            type="number"
            min={0}
            max={40}
            step={1}
            value={quoteSettings.taxPercent}
            onChange={(event) =>
              patchQuote({ taxPercent: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          Discount %
          <input
            type="number"
            min={0}
            max={40}
            step={1}
            value={quoteSettings.discountPercent}
            onChange={(event) =>
              patchQuote({ discountPercent: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          Finish premium %
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={quoteSettings.finishPremiumPercent}
            onChange={(event) =>
              patchQuote({ finishPremiumPercent: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          Labour allowance
          <input
            type="number"
            min={0}
            step={100}
            value={quoteSettings.labourAllowance}
            onChange={(event) =>
              patchQuote({ labourAllowance: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          Validity (days)
          <input
            type="number"
            min={1}
            max={365}
            step={1}
            value={quoteSettings.validityDays}
            onChange={(event) =>
              patchQuote({ validityDays: Number(event.currentTarget.value) })
            }
          />
        </label>
      </div>

      <div className="report-cost-grid">
        {quote.summaryCards.map((card) => (
          <div key={card.label} className="report-card">
            <span className="report-card-label">{card.label}</span>
            <strong>{money(card.amount)}</strong>
          </div>
        ))}
      </div>

      <section className="report-subsection">
        <h3>Itemized estimate</h3>
        <div className="shop-table-wrap">
          <table className="shop-table">
            <thead>
              <tr>
                <th>Mark</th>
                <th>Cabinet</th>
                <th>Workshop</th>
                <th>Finish</th>
                <th>Premium</th>
                <th>Sell</th>
              </tr>
            </thead>
            <tbody>
              {quote.cabinetLines.map((line) => (
                <tr key={line.cabinetId}>
                  <td>
                    <code className="shop-ref">{line.mark}</code>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="shop-source-btn"
                      onClick={() => onSelectCabinet?.(line.cabinetId)}
                    >
                      {line.cabinetName}
                    </button>
                  </td>
                  <td>{money(line.workshopCost)}</td>
                  <td>{money(line.finishCost)}</td>
                  <td>{money(line.finishPremium)}</td>
                  <td>
                    <strong>{money(line.sellPrice)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {quote.hardwareRollup.length > 0 ? (
        <section className="report-subsection">
          <h3>Hardware rollup</h3>
          <div className="shop-table-wrap">
            <table className="shop-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.hardwareRollup.map((line) => (
                  <tr key={line.id}>
                    <td>{line.label}</td>
                    <td>{line.quantity}</td>
                    <td>{money(line.unitCost)}</td>
                    <td>{money(line.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="report-subsection quote-terms">
        <h3>Commercial terms</h3>
        <label>
          Inclusions
          <textarea
            rows={2}
            value={quoteSettings.inclusions}
            onChange={(event) => patchQuote({ inclusions: event.currentTarget.value })}
          />
        </label>
        <label>
          Exclusions
          <textarea
            rows={2}
            value={quoteSettings.exclusions}
            onChange={(event) => patchQuote({ exclusions: event.currentTarget.value })}
          />
        </label>
      </section>

      <section className="report-subsection">
        <h3>Revision snapshots</h3>
        {report.quoteHistory.length === 0 ? (
          <p className="report-empty">
            No frozen quotes yet. Use Freeze for revision to lock pricing against the current
            revision.
          </p>
        ) : (
          <div className="shop-table-wrap">
            <table className="shop-table">
              <thead>
                <tr>
                  <th>Rev</th>
                  <th>Date</th>
                  <th>Workshop</th>
                  <th>Sell</th>
                  <th>Cabinets</th>
                  <th>Rules</th>
                </tr>
              </thead>
              <tbody>
                {report.quoteHistory.map((snap) => (
                  <tr key={snap.id}>
                    <td>
                      <code className="shop-ref">{snap.revision}</code>
                    </td>
                    <td>{new Date(snap.quotedAt).toLocaleDateString()}</td>
                    <td>{money(snap.workshopTotal)}</td>
                    <td>
                      <strong>{money(snap.sellTotal)}</strong>
                    </td>
                    <td>{snap.cabinetCount}</td>
                    <td>
                      M{snap.markupPercent}% · T{snap.taxPercent}% · F
                      {snap.finishPremiumPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
