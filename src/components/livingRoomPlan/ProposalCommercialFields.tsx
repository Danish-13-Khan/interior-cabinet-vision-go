import type { ProjectJobMeta } from "../../domain/jobMeta";
import type { QuoteSettings } from "../../domain/quoteSettings";

export function ProposalCommercialFields({
  quote,
  job,
  onQuote,
  onJob,
}: {
  quote: QuoteSettings;
  job: ProjectJobMeta;
  onQuote: (patch: Partial<QuoteSettings>) => void;
  onJob: (patch: Partial<ProjectJobMeta>) => void;
}) {
  return (
    <div className="proposal-review-fields">
      <label>
        Customer
        <input
          value={job.customerName}
          onChange={(event) => onJob({ customerName: event.currentTarget.value })}
        />
      </label>
      <label>
        Project #
        <input
          value={job.projectNumber}
          onChange={(event) => onJob({ projectNumber: event.currentTarget.value })}
        />
      </label>
      <label>
        Revision
        <input
          value={job.revision}
          onChange={(event) => onJob({ revision: event.currentTarget.value })}
        />
      </label>
      <label>
        Markup %
        <input
          type="number"
          min={0}
          max={100}
          value={quote.markupPercent}
          onChange={(event) => onQuote({ markupPercent: Number(event.currentTarget.value) })}
        />
      </label>
      <label>
        {quote.taxLabel} %
        <input
          type="number"
          min={0}
          max={40}
          value={quote.taxPercent}
          onChange={(event) => onQuote({ taxPercent: Number(event.currentTarget.value) })}
        />
      </label>
      <label>
        Discount %
        <input
          type="number"
          min={0}
          max={40}
          value={quote.discountPercent}
          onChange={(event) => onQuote({ discountPercent: Number(event.currentTarget.value) })}
        />
      </label>
      <label>
        Currency
        <input
          value={quote.currencyLabel}
          onChange={(event) => onQuote({ currencyLabel: event.currentTarget.value })}
        />
      </label>
      <label>
        Tax label
        <input
          value={quote.taxLabel}
          onChange={(event) => onQuote({ taxLabel: event.currentTarget.value })}
        />
      </label>
      <fieldset>
        <legend>Price detail</legend>
        <label>
          <input
            type="radio"
            name="proposal-price-detail"
            checked={quote.priceDetail === "summary"}
            onChange={() => onQuote({ priceDetail: "summary" })}
          />
          Summary
        </label>
        <label>
          <input
            type="radio"
            name="proposal-price-detail"
            checked={quote.priceDetail === "itemized"}
            onChange={() => onQuote({ priceDetail: "itemized" })}
          />
          Itemized
        </label>
      </fieldset>
      <label>
        Inclusions
        <textarea
          rows={2}
          value={quote.inclusions}
          onChange={(event) => onQuote({ inclusions: event.currentTarget.value })}
        />
      </label>
      <label>
        Exclusions
        <textarea
          rows={2}
          value={quote.exclusions}
          onChange={(event) => onQuote({ exclusions: event.currentTarget.value })}
        />
      </label>
    </div>
  );
}
