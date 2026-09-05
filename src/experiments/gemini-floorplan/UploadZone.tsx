type PdfMeta = { pageCount: number } | null;

type Props = {
  fileName: string | null;
  previewUrl: string | null;
  uploadError: string | null;
  busy: boolean;
  pdfInfo: PdfMeta;
  pdfPage: number;
  onFile: (file: File | null) => void;
  onSelectPdfPage: (page: number) => void;
};

const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

export function UploadZone({
  fileName,
  previewUrl,
  uploadError,
  busy,
  pdfInfo,
  pdfPage,
  onFile,
  onSelectPdfPage,
}: Props) {
  return (
    <section className="gfl-panel gfl-upload" aria-label="Floor plan upload">
      <header className="gfl-panel__head">
        <h2>2D floor plan</h2>
        <p>PNG, JPEG, WebP, or PDF · images ≤8 MB · PDF ≤20 MB.</p>
      </header>
      <label className="gfl-upload__drop">
        <input
          type="file"
          accept={ACCEPT}
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="Selected floor plan preview" />
        ) : (
          <span>Drop or choose image / PDF</span>
        )}
      </label>
      {pdfInfo ? (
        <label className="gfl-field gfl-upload__pdf">
          <span>PDF page (1–{pdfInfo.pageCount})</span>
          <select
            value={pdfPage}
            disabled={busy}
            onChange={(e) => onSelectPdfPage(Number(e.target.value))}
          >
            {Array.from({ length: pdfInfo.pageCount }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Page {n}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {fileName ? <p className="gfl-upload__name">{fileName}</p> : null}
      {uploadError ? <p className="gfl-upload__error">{uploadError}</p> : null}
      <p className="gfl-upload__fixtures">
        Sample images:{" "}
        <a href="/experiments/gemini-floorplan/fixtures/rect-kitchen.png" download>
          rect kitchen
        </a>
        {" · "}
        <a href="/experiments/gemini-floorplan/fixtures/l-living.png" download>
          L living
        </a>
        {" · "}
        <a href="/experiments/gemini-floorplan/fixtures/two-room.png" download>
          two-room
        </a>
      </p>
    </section>
  );
}
