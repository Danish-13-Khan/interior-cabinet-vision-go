import type { ImportedAsset } from "../../domain/livingRoom";
import type { LengthUnit } from "../../workers/modelImport/protocol";
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
