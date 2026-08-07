import type { ProjectStandards } from "../../domain/projectStandards";
import {
  createStandardsPackEntry,
  type StandardsLibraryEntry,
  type WorkshopLibraryPack,
} from "../../domain/workshopLibrary";

type LibraryStandardsTabProps = {
  library: WorkshopLibraryPack;
  standardsPacks: StandardsLibraryEntry[];
  projectStandards: ProjectStandards;
  onPersist: (next: WorkshopLibraryPack, note: string) => void;
  onApplyStandardsPack: (standards: ProjectStandards) => void;
  onMessage: (message: string) => void;
};

export function LibraryStandardsTab({
  library,
  standardsPacks,
  projectStandards,
  onPersist,
  onApplyStandardsPack,
  onMessage,
}: LibraryStandardsTabProps) {
  return (
    <section className="report-subsection">
      <div className="library-section-actions">
        <button
          type="button"
          className="tb-btn"
          onClick={() => {
            const label = window.prompt("Standards pack name:", "Current project standards");
            if (!label?.trim()) return;
            const entry = createStandardsPackEntry(
              label.trim(),
              projectStandards,
              "Saved from active project standards",
            );
            onPersist(
              {
                ...library,
                standardsPacks: [...library.standardsPacks, entry],
              },
              `Saved standards pack ${entry.label} v${entry.version}.`,
            );
          }}
        >
          Save current standards pack
        </button>
      </div>
      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Pack</th>
              <th>Material</th>
              <th>Version</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {standardsPacks.map((pack) => (
              <tr key={pack.id}>
                <td>
                  <strong>{pack.label}</strong>
                  <span className="shop-sub">{pack.description}</span>
                </td>
                <td>{pack.standards.materialPresetId}</td>
                <td>v{pack.version}</td>
                <td>
                  <button
                    type="button"
                    className="shop-source-btn"
                    onClick={() => {
                      onApplyStandardsPack(pack.standards);
                      onMessage(`Applied standards pack ${pack.label}.`);
                    }}
                  >
                    Apply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
