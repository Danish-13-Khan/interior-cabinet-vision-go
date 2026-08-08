type FreezeSectionProps = {
  freezeNote: string;
  bumpRevision: boolean;
  onFreezeNoteChange: (value: string) => void;
  onBumpRevisionChange: (value: boolean) => void;
  onFreeze: () => void;
};

export function FreezeSection({
  freezeNote,
  bumpRevision,
  onFreezeNoteChange,
  onBumpRevisionChange,
  onFreeze,
}: FreezeSectionProps) {
  return (
    <section className="review-section">
      <h3>Freeze revision snapshot</h3>
      <div className="review-form-row">
        <input
          type="text"
          value={freezeNote}
          placeholder="Optional freeze note (shop / client)"
          onChange={(event) => onFreezeNoteChange(event.currentTarget.value)}
        />
        <label className="review-check">
          <input
            type="checkbox"
            checked={bumpRevision}
            onChange={(event) => onBumpRevisionChange(event.currentTarget.checked)}
          />
          Bump revision letter
        </label>
        <button type="button" className="tb-btn tb-accent" onClick={onFreeze}>
          Freeze Revision
        </button>
      </div>
    </section>
  );
}
