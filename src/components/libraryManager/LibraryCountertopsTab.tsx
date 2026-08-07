import type { ProjectStandards } from "../../domain/projectStandards";
import {
  createCountertopEntry,
  type CountertopLibraryEntry,
  type WorkshopLibraryPack,
} from "../../domain/workshopLibrary";

type LibraryCountertopsTabProps = {
  library: WorkshopLibraryPack;
  countertops: CountertopLibraryEntry[];
  projectStandards: ProjectStandards;
  onPersist: (next: WorkshopLibraryPack, note: string) => void;
};

export function LibraryCountertopsTab({
  library,
  countertops,
  projectStandards,
  onPersist,
}: LibraryCountertopsTabProps) {
  return (
    <section className="report-subsection">
      <div className="library-section-actions">
        <button
          type="button"
          className="tb-btn"
          onClick={() => {
            const label = window.prompt("Countertop preset name:", "Shop laminate 28");
            if (!label?.trim()) return;
            const entry = createCountertopEntry(label.trim(), {
              thicknessMm: projectStandards.countertopThicknessMm,
              overhangFrontMm: projectStandards.countertopOverhangFrontMm,
              overhangSidesMm: projectStandards.countertopOverhangSidesMm,
            });
            onPersist(
              { ...library, countertops: [...library.countertops, entry] },
              `Added countertop ${entry.label}.`,
            );
          }}
        >
          Add countertop preset
        </button>
      </div>
      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Preset</th>
              <th>Thickness</th>
              <th>Overhangs</th>
              <th>Material</th>
            </tr>
          </thead>
          <tbody>
            {countertops.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <strong>{entry.label}</strong>
                </td>
                <td>{entry.thicknessMm} mm</td>
                <td>
                  F{entry.overhangFrontMm} / S{entry.overhangSidesMm}
                </td>
                <td>{entry.materialLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
