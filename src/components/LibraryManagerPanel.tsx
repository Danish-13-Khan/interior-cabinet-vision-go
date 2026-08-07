import { useMemo, useState } from "react";
import type { CabinetConfig } from "../domain/cabinetDimensions";
import type { ProjectStandards } from "../domain/projectStandards";
import {
  createCabinetPresetFromConfig,
  createCountertopEntry,
  createDoorStyleEntry,
  createHardwareEntry,
  createMaterialEntry,
  createStandardsPackEntry,
  exportWorkshopLibraryJson,
  importWorkshopLibraryJson,
  librarySummary,
  listCountertopLibrary,
  listDoorStyleLibrary,
  listHardwareLibrary,
  listMaterialLibrary,
  listStandardsLibrary,
  mergeWorkshopLibraries,
  saveWorkshopLibrary,
  type WorkshopLibraryPack,
} from "../domain/libraryManager";
import { FINISHES, MATERIAL_PRESETS, EDGE_BANDING_OPTIONS } from "../domain/materialSystem";
import type { DoorStyle } from "../domain/cabinetOpeningStructure";
import type { HardwareKind } from "../domain/hardwareSystem";

type LibraryManagerTab =
  | "overview"
  | "cabinets"
  | "doors"
  | "materials"
  | "hardware"
  | "countertops"
  | "standards";

type LibraryManagerPanelProps = {
  library: WorkshopLibraryPack;
  projectStandards: ProjectStandards;
  selectedConfig?: CabinetConfig | null;
  onLibraryChange: (next: WorkshopLibraryPack) => void;
  onApplyStandardsPack: (standards: ProjectStandards) => void;
  onClose: () => void;
};

export function LibraryManagerPanel({
  library,
  projectStandards,
  selectedConfig = null,
  onLibraryChange,
  onApplyStandardsPack,
  onClose,
}: LibraryManagerPanelProps) {
  const [tab, setTab] = useState<LibraryManagerTab>("overview");
  const [message, setMessage] = useState<string | null>(null);

  const summary = useMemo(() => librarySummary(library), [library]);
  const doorStyles = listDoorStyleLibrary(library);
  const materials = listMaterialLibrary(library);
  const hardware = listHardwareLibrary(library);
  const countertops = listCountertopLibrary(library);
  const standardsPacks = listStandardsLibrary(library);

  function persist(next: WorkshopLibraryPack, note: string) {
    saveWorkshopLibrary(next);
    onLibraryChange(next);
    setMessage(note);
  }

  function handleExport() {
    const blob = new Blob([exportWorkshopLibraryJson(library)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `workshop-library-v${library.schemaVersion}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Exported workshop library JSON.");
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importWorkshopLibraryJson(String(reader.result ?? ""));
        const merged = mergeWorkshopLibraries(library, imported);
        persist(merged, `Imported and merged library (${imported.cabinetPresets.length} cabinet presets).`);
      } catch {
        setMessage("Import failed: invalid library JSON.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="library-manager" role="dialog" aria-label="Library Manager">
      <header className="library-manager-header">
        <div>
          <strong>Library Manager</strong>
          <span>
            Workshop libraries · {summary.userOwned} user entries · schema v
            {library.schemaVersion}
          </span>
        </div>
        <div className="library-manager-actions">
          <button type="button" className="tb-btn" onClick={handleExport}>
            Export JSON
          </button>
          <label className="tb-btn library-import-btn">
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) handleImportFile(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button type="button" className="tb-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </header>

      <div className="library-manager-tabs" role="tablist">
        {(
          [
            ["overview", "Overview"],
            ["cabinets", "Cabinets"],
            ["doors", "Doors"],
            ["materials", "Materials"],
            ["hardware", "Hardware"],
            ["countertops", "Countertops"],
            ["standards", "Standards"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`report-center-tab ${tab === id ? "is-active" : ""}`}
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? <p className="library-manager-message">{message}</p> : null}

      <div className="library-manager-body">
        {tab === "overview" ? (
          <div className="report-summary-grid">
            <div className="report-card">
              <span className="report-card-label">Door styles</span>
              <strong>{summary.doorStyles}</strong>
            </div>
            <div className="report-card">
              <span className="report-card-label">Materials</span>
              <strong>{summary.materials}</strong>
            </div>
            <div className="report-card">
              <span className="report-card-label">Hardware</span>
              <strong>{summary.hardware}</strong>
            </div>
            <div className="report-card">
              <span className="report-card-label">Countertops</span>
              <strong>{summary.countertops}</strong>
            </div>
            <div className="report-card">
              <span className="report-card-label">Standards packs</span>
              <strong>{summary.standardsPacks}</strong>
            </div>
            <div className="report-card">
              <span className="report-card-label">User cabinet presets</span>
              <strong>{summary.cabinetPresets}</strong>
            </div>
          </div>
        ) : null}

        {tab === "cabinets" ? (
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
                  persist(
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
                    library.cabinetPresets.map((preset) => (
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
                              persist(
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
        ) : null}

        {tab === "doors" ? (
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
                  persist(
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
        ) : null}

        {tab === "materials" ? (
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
                  persist(
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
        ) : null}

        {tab === "hardware" ? (
          <section className="report-subsection">
            <div className="library-section-actions">
              <button
                type="button"
                className="tb-btn"
                onClick={() => {
                  const label = window.prompt("Hardware name:", "Custom soft hinge");
                  if (!label?.trim()) return;
                  const kind = (window.prompt(
                    "Kind (hinge/slide/handle/accessory):",
                    "hinge",
                  ) || "hinge") as HardwareKind;
                  const cost = Number(window.prompt("Unit cost ₹:", "100") || 100);
                  const entry = createHardwareEntry(label.trim(), kind, cost);
                  persist(
                    { ...library, hardware: [...library.hardware, entry] },
                    `Added hardware ${entry.label}.`,
                  );
                }}
              >
                Add hardware SKU
              </button>
            </div>
            <div className="shop-table-wrap">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>Hardware</th>
                    <th>Kind</th>
                    <th>Cost</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {hardware.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.label}</strong>
                      </td>
                      <td>{item.kind}</td>
                      <td>₹{item.costPerUnit}</td>
                      <td>{"userDefined" in item && item.userDefined ? "User" : "Built-in"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "countertops" ? (
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
                  persist(
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
        ) : null}

        {tab === "standards" ? (
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
                  persist(
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
                            setMessage(`Applied standards pack ${pack.label}.`);
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
        ) : null}
      </div>
    </div>
  );
}
