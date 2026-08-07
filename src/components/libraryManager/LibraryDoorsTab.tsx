import type { DoorStyle } from "../../domain/cabinetOpeningStructure";
import {
  createDoorStyleEntry,
  type DoorStyleLibraryEntry,
  type WorkshopLibraryPack,
} from "../../domain/workshopLibrary";

type LibraryDoorsTabProps = {
  library: WorkshopLibraryPack;
  doorStyles: DoorStyleLibraryEntry[];
  onPersist: (next: WorkshopLibraryPack, note: string) => void;
};

export function LibraryDoorsTab({
  library,
  doorStyles,
  onPersist,
}: LibraryDoorsTabProps) {
  return (
    <section className="report-subsection">
      <div className="library-section-actions">
        <button
          type="button"
          className="tb-btn"
          onClick={() => {
            const label = window.prompt("Door style name:", "Custom single");
            if (!label?.trim()) return;
            const style = (window.prompt("Style (single/double/bi-fold):", "single") ||
              "single") as DoorStyle;
            const entry = createDoorStyleEntry(label.trim(), style);
            onPersist(
              { ...library, doorStyles: [...library.doorStyles, entry] },
              `Added door style ${entry.label}.`,
            );
          }}
        >
          Add door style
        </button>
      </div>
      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Style</th>
              <th>Door</th>
              <th>Version</th>
            </tr>
          </thead>
          <tbody>
            {doorStyles.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <strong>{entry.label}</strong>
                  <span className="shop-sub">{entry.description}</span>
                </td>
                <td>{entry.doorStyle}</td>
                <td>v{entry.version}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
