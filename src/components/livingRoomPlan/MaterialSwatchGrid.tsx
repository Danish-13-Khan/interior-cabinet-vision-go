import { useMemo, useRef, useState } from "react";
import type { InteriorProject, MaterialKind } from "../../domain/interiorProject";

type Props = {
  materials: InteriorProject["materials"];
  activeMaterialId?: string | null;
  onPick: (materialId: string) => void;
  compact?: boolean;
  onImport?: (file: File) => void;
};

export function MaterialSwatchGrid({ materials, activeMaterialId, onPick, compact, onImport }: Props) {
  const kinds = useMemo(() => {
    const unique = [...new Set(materials.map((material) => material.kind))];
    return unique.sort();
  }, [materials]);
  const [kind, setKind] = useState<"all" | MaterialKind>("all");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const visible = kind === "all" ? materials : materials.filter((material) => material.kind === kind);

  return (
    <div className={`lr-material-browser ${compact ? "is-compact" : ""}`} aria-label="Material browser">
      <div className="lr-material-kind-filters" role="tablist" aria-label="Material kinds">
        <button type="button" role="tab" className={kind === "all" ? "is-active" : ""} onClick={() => setKind("all")}>All</button>
        {kinds.map((item) => (
          <button type="button" role="tab" key={item} className={kind === item ? "is-active" : ""} onClick={() => setKind(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="lr-paint-swatches">
        {visible.map((material) => (
          <button
            key={material.id}
            type="button"
            data-material-id={material.id}
            className={activeMaterialId === material.id ? "is-active" : ""}
            title={`Apply ${material.name}`}
            onClick={() => onPick(material.id)}
          >
            <i style={{ background: material.color }} />
            <span>{material.name}</span>
            <small>{material.kind}</small>
          </button>
        ))}
      </div>
      {onImport ? (
        <label className="lr-import-finish">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }}
          />
          <button type="button" onClick={() => fileRef.current?.click()}>Import texture</button>
        </label>
      ) : null}
    </div>
  );
}
