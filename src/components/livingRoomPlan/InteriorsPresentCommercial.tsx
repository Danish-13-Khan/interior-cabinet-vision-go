import type { QuoteSettings } from "../../domain/quoteSettings";

export function InteriorsPresentCommercial({
  quote,
  onQuote,
}: {
  quote: QuoteSettings;
  onQuote: (patch: Partial<QuoteSettings>) => void;
}) {
  return (
    <section className="proposal-review-fields" data-testid="interiors-present-commercial">
      <strong>Commercial settings</strong>
      <label>
        Markup %
        <input
          type="number" min={0} max={100} value={quote.markupPercent}
          onChange={(event) => onQuote({ markupPercent: Number(event.currentTarget.value) })}
        />
      </label>
      <label>
        {quote.taxLabel} %
        <input
          type="number" min={0} max={40} value={quote.taxPercent}
          onChange={(event) => onQuote({ taxPercent: Number(event.currentTarget.value) })}
        />
      </label>
      <label>
        Discount %
        <input
          type="number" min={0} max={40} value={quote.discountPercent}
          onChange={(event) => onQuote({ discountPercent: Number(event.currentTarget.value) })}
        />
      </label>
      <label>
        Validity days
        <input
          type="number" min={1} max={365} data-testid="interiors-present-validity"
          value={quote.validityDays}
          onChange={(event) => onQuote({ validityDays: Number(event.currentTarget.value) })}
        />
      </label>
    </section>
  );
}
