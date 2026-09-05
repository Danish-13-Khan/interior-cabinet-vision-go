type Props = {
  fileName: string | null;
  previewUrl: string | null;
  onFile: (file: File | null) => void;
};

const ACCEPT = "image/png,image/jpeg,image/webp";

export function UploadZone({ fileName, previewUrl, onFile }: Props) {
  return (
    <section className="gfl-panel gfl-upload" aria-label="Floor plan upload">
      <header className="gfl-panel__head">
        <h2>2D floor plan</h2>
        <p>PNG, JPEG, or WebP. Vision extract is Phase 1.</p>
      </header>
      <label className="gfl-upload__drop">
        <input
          type="file"
          accept={ACCEPT}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="Selected floor plan preview" />
        ) : (
          <span>Drop or choose a floor-plan image</span>
        )}
      </label>
      {fileName ? <p className="gfl-upload__name">{fileName}</p> : null}
    </section>
  );
}
