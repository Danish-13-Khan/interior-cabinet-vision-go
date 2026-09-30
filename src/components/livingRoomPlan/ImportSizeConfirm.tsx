import type { ImportedAsset } from "../../domain/livingRoom";
import type { LengthUnit, UpAxis } from "../../workers/modelImport/protocol";
import { importUnitChoice, LENGTH_UNITS, sizesUnderUnits } from "../../workers/modelImport/units";

export function ImportSizeConfirm({
  asset,
  busy = false,
  onUnit,
}: {
  asset: ImportedAsset;
  busy?: boolean;
  onUnit: (unit: LengthUnit | "file") => void;
}) {
  if (asset.rawLargestSide == null) return null;
  const choices = sizesUnderUnits(asset.rawLargestSide);
  const choice = importUnitChoice(asset.scaleToMm, asset.importUnit);
  const fileMm = asset.scaleToMm == null ? null : Math.round(asset.rawLargestSide * asset.scaleToMm);
  return (
    <label className="lr-import-unit">
      Unit
      <select aria-label="Import unit" value={choice.value} disabled={busy} onChange={(event) => onUnit(event.target.value as LengthUnit | "file")}>
        {choice.label && fileMm != null ? <option value="file">{choice.label} · {fileMm} mm</option> : null}
        {LENGTH_UNITS.map((unit) => (
          <option key={unit} value={unit}>{unit} · {Math.round(choices[unit])} mm</option>
        ))}
      </select>
    </label>
  );
}

const FBX_AXIS_HINT = "FBX files set their own up axis.";

/** Re-runs the import with the other up axis. FBX files record their own axis, so the choice is locked. */
export function ImportUpAxisConfirm({
  asset,
  busy = false,
  fixedByFile = false,
  onUpAxis,
}: {
  asset: ImportedAsset;
  busy?: boolean;
  fixedByFile?: boolean;
  onUpAxis: (axis: UpAxis) => void;
}) {
  if (asset.rawLargestSide == null) return null;
  return (
    <label className="lr-import-unit">
      Up axis
      <select
        aria-label="Import up axis"
        value={fixedByFile ? "y" : asset.importUpAxis ?? "y"}
        disabled={busy || fixedByFile}
        title={fixedByFile ? FBX_AXIS_HINT : undefined}
        onChange={(event) => onUpAxis(event.target.value === "z" ? "z" : "y")}
      >
        <option value="y">Y-up</option>
        <option value="z">Z-up</option>
      </select>
      {fixedByFile ? <small className="lr-import-hint">{FBX_AXIS_HINT}</small> : null}
    </label>
  );
}
