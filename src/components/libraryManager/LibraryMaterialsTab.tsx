import {
  EDGE_BANDING_OPTIONS,
  FINISHES,
  MATERIAL_PRESETS,
} from "../../domain/materialSystem";
import {
  createMaterialEntry,
  type MaterialLibraryEntry,
  type WorkshopLibraryPack,
} from "../../domain/workshopLibrary";

type LibraryMaterialsTabProps = {
  library: WorkshopLibraryPack;
  materials: MaterialLibraryEntry[];
  onPersist: (next: WorkshopLibraryPack, note: string) => void;
};

export function LibraryMaterialsTab({
  library,
  materials,
  onPersist,
}: LibraryMaterialsTabProps) {
  return (
    <section className="report-subsection">
      <div className="library-section-actions">
        <button
          type="button"
          className="tb-btn"
          onClick={() => {
            const label = window.prompt("Material library name:", "Shop painted MDF");
            if (!label?.trim()) return;
            const entry = createMaterialEntry(
              label.trim(),
              MATERIAL_PRESETS[1]?.id ?? "mdf-painted",
              FINISHES[0]?.id ?? "white-matte",
              EDGE_BANDING_OPTIONS[0]?.id ?? "abs-1mm",
              "User material pack",
            );
            onPersist(
              { ...library, materials: [...library.materials, entry] },
              `Added material ${entry.label}.`,
            );
          }}
        >
          Add material pack
        </button>
      </div>
      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Preset</th>
              <th>Finish</th>
              <th>Edge</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <strong>{entry.label}</strong>
                </td>
                <td>{entry.materialPresetId}</td>
                <td>{entry.finishId}</td>
                <td>{entry.edgeBandingId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
