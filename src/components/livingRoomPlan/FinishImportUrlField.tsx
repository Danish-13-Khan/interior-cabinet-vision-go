import { useState } from "react";

type Props = {
  busy?: boolean;
  onSubmit: (url: string) => void;
};

/** M6.2 — paste a direct image URL to stage a finish (bytes copied on fetch). */
export function FinishImportUrlField({ busy, onSubmit }: Props) {
  const [url, setUrl] = useState("");
  return (
    <form
      className="lr-finish-import-url"
      data-testid="finish-import-url"
      onSubmit={(event) => {
        event.preventDefault();
        const next = url.trim();
        if (!next || busy) return;
        onSubmit(next);
      }}
    >
      <label>
        <span>Or import from URL</span>
        <input
          type="url"
          data-testid="finish-import-url-input"
          placeholder="https://…/texture.png"
          value={url}
          disabled={busy}
          onChange={(event) => setUrl(event.target.value)}
          aria-label="Finish image URL"
        />
      </label>
      <button type="submit" data-testid="finish-import-url-submit" disabled={busy || !url.trim()}>
        {busy ? "Fetching…" : "Fetch texture"}
      </button>
    </form>
  );
}
