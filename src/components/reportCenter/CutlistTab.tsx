import { useMemo, useState } from "react";
import type { ProjectReport } from "../../domain/projectReport";
import { CutlistTable, type CutlistGroupMode } from "./helpers";

type CutlistTabProps = {
  report: ProjectReport;
  selectedCabinetId?: string | null;
  onSelectCabinet?: (cabinetId: string) => void;
};

export function CutlistTab({
  report,
  selectedCabinetId = null,
  onSelectCabinet,
}: CutlistTabProps) {
  const [cutlistMode, setCutlistMode] = useState<CutlistGroupMode>("material");

  const selectedLines = useMemo(() => {
    if (!selectedCabinetId) return [];
    return report.productionCutlist.filter((line) => line.cabinetId === selectedCabinetId);
  }, [report.productionCutlist, selectedCabinetId]);

  const cutlistGroups =
    cutlistMode === "material"
      ? report.groupedByMaterial
      : cutlistMode === "thickness"
        ? report.groupedByThickness
        : cutlistMode === "cabinet"
          ? report.groupedByCabinet
          : null;

  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Workshop Cutlist</strong>
          <span>
            {selectedCabinetId
              ? `${selectedLines.length} lines for selection · ${report.productionCutlist.length} project`
              : `${report.productionCutlist.length} production lines with shop refs`}
          </span>
        </div>
        <div className="cutlist-mode-toggle">
          {(
            [
              ["material", "By material"],
              ["thickness", "By thickness"],
              ["cabinet", "By cabinet"],
              ["flat", "Flat"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={cutlistMode === id ? "is-active" : ""}
              onClick={() => setCutlistMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {selectedLines.length > 0 ? (
        <section className="report-subsection">
          <h3>Selected cabinet</h3>
          <CutlistTable lines={selectedLines} onSelectCabinet={onSelectCabinet} />
        </section>
      ) : null}

      {cutlistMode === "flat" ? (
        <CutlistTable
          lines={report.productionCutlist}
          onSelectCabinet={onSelectCabinet}
        />
      ) : (
        <div className="cutlist-group-stack">
          {(cutlistGroups ?? []).map((group) => (
            <section key={group.key} className="cutlist-group-card">
              <header>
                <strong>{group.title}</strong>
                <span>
                  {group.totalQuantity} pcs · {group.totalAreaM2.toFixed(2)} m² ·{" "}
                  {group.lines.length} lines
                </span>
              </header>
              <CutlistTable lines={group.lines} onSelectCabinet={onSelectCabinet} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
