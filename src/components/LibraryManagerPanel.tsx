import { useMemo, useState } from "react";
import type { CabinetConfig } from "../domain/cabinetDimensions";
import type { ProjectStandards } from "../domain/projectStandards";
import {
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
} from "../domain/workshopLibrary";
import { LibraryOverviewTab } from "./libraryManager/LibraryOverviewTab";
import { LibraryCabinetsTab } from "./libraryManager/LibraryCabinetsTab";
import { LibraryDoorsTab } from "./libraryManager/LibraryDoorsTab";
import { LibraryMaterialsTab } from "./libraryManager/LibraryMaterialsTab";
import { LibraryHardwareTab } from "./libraryManager/LibraryHardwareTab";
import { LibraryCountertopsTab } from "./libraryManager/LibraryCountertopsTab";
import { LibraryStandardsTab } from "./libraryManager/LibraryStandardsTab";

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
        persist(
          merged,
          `Imported and merged library (${imported.cabinetPresets.length} cabinet presets).`,
        );
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
        {tab === "overview" ? <LibraryOverviewTab summary={summary} /> : null}
        {tab === "cabinets" ? (
          <LibraryCabinetsTab
            library={library}
            selectedConfig={selectedConfig}
            onPersist={persist}
          />
        ) : null}
        {tab === "doors" ? (
          <LibraryDoorsTab library={library} doorStyles={doorStyles} onPersist={persist} />
        ) : null}
        {tab === "materials" ? (
          <LibraryMaterialsTab library={library} materials={materials} onPersist={persist} />
        ) : null}
        {tab === "hardware" ? (
          <LibraryHardwareTab library={library} hardware={hardware} onPersist={persist} />
        ) : null}
        {tab === "countertops" ? (
          <LibraryCountertopsTab
            library={library}
            countertops={countertops}
            projectStandards={projectStandards}
            onPersist={persist}
          />
        ) : null}
        {tab === "standards" ? (
          <LibraryStandardsTab
            library={library}
            standardsPacks={standardsPacks}
            projectStandards={projectStandards}
            onPersist={persist}
            onApplyStandardsPack={onApplyStandardsPack}
            onMessage={setMessage}
          />
        ) : null}
      </div>
    </div>
  );
}
