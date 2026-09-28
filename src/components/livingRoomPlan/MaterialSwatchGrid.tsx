import { useMemo, useRef, useState } from "react";
import type { InteriorProject, MaterialKind } from "../../domain/interiorProject";
import { finishMapUrl } from "../../domain/livingRoom";

type Props = {
  materials: InteriorProject["materials"];
  activeMaterialId?: string | null;
  onPick: (materialId: string) => void;
  compact?: boolean;
  onImport?: (file: File) => void;
  importDisabled?: boolean;
  /** Hover / focus preview; null when the pointer leaves the grid. */
  onPreview?: (materialId: string | null) => void;
};

export function MaterialSwatchGrid({
  materials, activeMaterialId, onPick, compact, onImport, importDisabled, onPreview,
}: Props) {
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
      <div className="lr-paint-swatches" onMouseLeave={() => onPreview?.(null)}>
        {visible.map((material) => {
          const mapUrl = finishMapUrl(material);
          const applied = activeMaterialId === material.id;
          return (
            <button
              key={material.id}
              type="button"
              data-material-id={material.id}
              className={applied ? "is-active" : ""}
              aria-pressed={applied}
              title={`Apply ${material.name}`}
              onClick={() => onPick(material.id)}
              onMouseEnter={() => onPreview?.(material.id)}
              onFocus={() => onPreview?.(material.id)}
              onBlur={() => onPreview?.(null)}
            >
              <i
                className={mapUrl ? "has-map" : undefined}
                style={mapUrl ? { backgroundImage: `url(${mapUrl})`, backgroundColor: material.color } : { background: material.color }}
              />
              <span>{material.name}</span>
              <small>{applied ? "Applied" : material.kind}</small>
            </button>
          );
        })}
      </div>
      {onImport ? (
        <label className="lr-import-finish">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            data-testid="finish-import-input"
            disabled={importDisabled}
            onChange={(event) => {
              if (importDisabled) return;
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            data-testid="finish-import-open"
            disabled={importDisabled}
            onClick={() => {
              if (!importDisabled) fileRef.current?.click();
            }}
          >
            Import texture
          </button>
        </label>
      ) : null}
    </div>
  );
}
