import type { CabinetConfig } from "../../domain/cabinetDimensions";
import {
  createCabinetPresetFromConfig,
  type CabinetFamilyLibraryEntry,
  type WorkshopLibraryPack,
} from "../../domain/workshopLibrary";

type LibraryCabinetsTabProps = {
  library: WorkshopLibraryPack;
  selectedConfig: CabinetConfig | null;
  onPersist: (next: WorkshopLibraryPack, note: string) => void;
};

export function LibraryCabinetsTab({
  library,
  selectedConfig,
  onPersist,
}: LibraryCabinetsTabProps) {
  return (
    <section className="report-subsection">
      <div className="library-section-actions">
        <button
          type="button"
          className="tb-btn tb-accent"
          disabled={!selectedConfig}
          onClick={() => {
            if (!selectedConfig) return;
            const name = window.prompt("Cabinet preset name:", "Library preset");
            if (!name?.trim()) return;
            const entry = createCabinetPresetFromConfig(selectedConfig, name.trim());
            onPersist(
              {
                ...library,
                cabinetPresets: [...library.cabinetPresets, entry],
              },
              `Saved cabinet preset ${entry.label} v${entry.version}.`,
            );
          }}
        >
          Save selected cabinet to library
        </button>
      </div>
      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Preset</th>
              <th>Family</th>
              <th>Version</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {library.cabinetPresets.length === 0 ? (
              <tr>
                <td colSpan={4}>No user cabinet presets yet.</td>
              </tr>
            ) : (
              library.cabinetPresets.map((preset: CabinetFamilyLibraryEntry) => (
                <tr key={preset.id}>
                  <td>
                    <strong>{preset.label}</strong>
                    <span className="shop-sub">{preset.description}</span>
                  </td>
                  <td>{preset.family}</td>
                  <td>v{preset.version}</td>
                  <td>
                    <button
                      type="button"
                      className="shop-source-btn"
                      onClick={() =>
                        onPersist(
                          {
                            ...library,
                            cabinetPresets: library.cabinetPresets.filter(
                              (item) => item.id !== preset.id,
                            ),
                          },
                          `Removed ${preset.label}.`,
                        )
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
