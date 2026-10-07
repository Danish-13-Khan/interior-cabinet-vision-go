import { useState } from "react";
import { BRAND_LOGO_MAX_BYTES, clampBrandLogo, type QuoteSettings } from "../../domain/quoteSettings";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/** Studio identity printed on the proposal cover (roadmap D5): name, contact line, PNG or JPEG logo. */
export function InteriorsPresentBrand({
  quote,
  onQuote,
}: {
  quote: QuoteSettings;
  onQuote: (patch: Partial<QuoteSettings>) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function onLogo(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setError("Logo must be a PNG or JPEG.");
      return;
    }
    if (file.size > BRAND_LOGO_MAX_BYTES) {
      setError(`Logo must be under ${Math.round(BRAND_LOGO_MAX_BYTES / 1000)} KB.`);
      return;
    }
    const dataUrl = clampBrandLogo(await readAsDataUrl(file));
    if (!dataUrl) {
      setError("That image could not be used.");
      return;
    }
    setError(null);
    onQuote({ brandLogoDataUrl: dataUrl });
  }

  return (
    <section className="proposal-review-fields interiors-present-brand" data-testid="interiors-present-brand">
      <strong>Brand on the proposal</strong>
      <label>
        Studio name
        <input
          type="text" maxLength={60} value={quote.brandName} data-testid="interiors-present-brand-name"
          onChange={(event) => onQuote({ brandName: event.currentTarget.value })}
        />
      </label>
      <label>
        Contact line
        <input
          type="text" maxLength={120} value={quote.brandContact} placeholder="Phone · email · city"
          onChange={(event) => onQuote({ brandContact: event.currentTarget.value })}
        />
      </label>
      <label>
        Logo (PNG or JPEG, under 200 KB)
        <input
          type="file" accept="image/png,image/jpeg" data-testid="interiors-present-brand-logo"
          onChange={(event) => void onLogo(event.currentTarget.files?.[0])}
        />
      </label>
      {quote.brandLogoDataUrl ? (
        <div className="interiors-present-brand-logo">
          <img src={quote.brandLogoDataUrl} alt="Studio logo" />
          <button type="button" onClick={() => onQuote({ brandLogoDataUrl: "" })}>Remove logo</button>
        </div>
      ) : null}
      {error ? <p className="interiors-present-photo-error">{error}</p> : null}
    </section>
  );
}
