import type { ImportedAsset } from "../../domain/livingRoom";
import type { LengthUnit } from "../../workers/modelImport/protocol";
import { LENGTH_UNITS, sizesUnderUnits } from "../../workers/modelImport/units";

export function ImportSizeConfirm({ asset, onUnit }: { asset: ImportedAsset; onUnit: (unit: LengthUnit) => void }) {
  if (asset.rawLargestSide == null) return null;
  const choices = sizesUnderUnits(asset.rawLargestSide);
  return (
    <label className="lr-import-unit">
      Unit
      <select aria-label="Import unit" value={asset.importUnit ?? "m"} onChange={(event) => onUnit(event.target.value as LengthUnit)}>
        {LENGTH_UNITS.map((unit) => (
          <option key={unit} value={unit}>{unit} · {Math.round(choices[unit])} mm</option>
        ))}
      </select>
    </label>
  );
}
