type Props = {
  fileName: string | null;
  previewUrl: string | null;
  uploadError: string | null;
  onFile: (file: File | null) => void;
};

const ACCEPT = "image/png,image/jpeg,image/webp";

export function UploadZone({ fileName, previewUrl, uploadError, onFile }: Props) {
  return (
    <section className="gfl-panel gfl-upload" aria-label="Floor plan upload">
      <header className="gfl-panel__head">
        <h2>2D floor plan</h2>
        <p>PNG, JPEG, or WebP · max 8 MB.</p>
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
