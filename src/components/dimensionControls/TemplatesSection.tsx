export function TemplatesSection({
  onSaveCabinetTemplate,
}: {
  onSaveCabinetTemplate?: (name?: string) => void;
}) {
  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Templates</h2>
      </div>
      <div className="button-row">
        <button
          type="button"
          onClick={() => onSaveCabinetTemplate?.()}
          disabled={!onSaveCabinetTemplate}
        >
          Save cabinet as template
        </button>
      </div>
    </div>
  );
}
