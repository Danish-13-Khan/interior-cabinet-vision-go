import { useEffect, useMemo, useState } from "react";
import type { InteriorProject, MaterialEntity } from "../../domain/interiorProject";
import {
  hexToRgb,
  listRecentMaterialColours,
  resolveColourInput,
  shadeGroupForMaterial,
} from "../../domain/livingRoom";

type Props = {
  project: InteriorProject;
  material: MaterialEntity | null;
  onApplyColour: (color: string) => void;
};

/** M3 — fixed shade chips, HEX/RGB fields, and recent colours for the active material. */
export function MaterialColourPanel({ project, material, onApplyColour }: Props) {
  const shades = useMemo(
    () => (material ? shadeGroupForMaterial(material) : []),
    [material],
  );
  const recent = listRecentMaterialColours(project);
  const [hex, setHex] = useState("#ffffff");
  const [r, setR] = useState(255);
  const [g, setG] = useState(255);
  const [b, setB] = useState(255);

  useEffect(() => {
    if (!material) return;
    setHex(material.color);
    const next = hexToRgb(material.color);
    if (!next) return;
    setR(next.r);
    setG(next.g);
    setB(next.b);
  }, [material?.id, material?.color]);

  if (!material) {
    return (
      <section className="lr-material-colour" data-testid="model-material-colour" aria-label="Material colour">
        <p>Select a material swatch to choose shades or a custom colour.</p>
      </section>
    );
  }

  function syncFromMaterialColor(color: string) {
    setHex(color);
    const next = hexToRgb(color);
    if (!next) return;
    setR(next.r);
    setG(next.g);
    setB(next.b);
  }

  function applyHex() {
    const color = resolveColourInput({ hex });
    if (!color) return;
    syncFromMaterialColor(color);
    onApplyColour(color);
  }

  function applyRgb() {
    const color = resolveColourInput({ r, g, b });
    if (!color) return;
    syncFromMaterialColor(color);
    onApplyColour(color);
  }

  return (
    <section className="lr-material-colour" data-testid="model-material-colour" aria-label="Material colour">
      <header>
        <strong>Colour</strong>
        <span>{material.name}</span>
      </header>
      <div className="lr-material-shades" role="list" aria-label="Shade group">
        {shades.map((shade) => (
          <button
            key={shade.id}
            type="button"
            role="listitem"
            data-testid={`material-shade-${shade.id}`}
            title={shade.label}
            className={material.color.toLowerCase() === shade.color.toLowerCase() ? "is-active" : ""}
            onClick={() => {
              syncFromMaterialColor(shade.color);
              onApplyColour(shade.color);
            }}
          >
            <i style={{ background: shade.color }} />
            <span>{shade.label}</span>
          </button>
        ))}
      </div>
      <div className="lr-material-colour-fields">
        <label>
          HEX
          <input
            data-testid="material-colour-hex"
            value={hex}
            onChange={(event) => setHex(event.target.value)}
            onBlur={applyHex}
            onKeyDown={(event) => { if (event.key === "Enter") applyHex(); }}
            spellCheck={false}
          />
        </label>
        <label>
          R
          <input data-testid="material-colour-r" type="number" min={0} max={255} value={r}
            onChange={(event) => setR(Number(event.target.value))} onBlur={applyRgb} />
        </label>
        <label>
          G
          <input data-testid="material-colour-g" type="number" min={0} max={255} value={g}
            onChange={(event) => setG(Number(event.target.value))} onBlur={applyRgb} />
        </label>
        <label>
          B
          <input data-testid="material-colour-b" type="number" min={0} max={255} value={b}
            onChange={(event) => setB(Number(event.target.value))} onBlur={applyRgb} />
        </label>
      </div>
      {recent.length > 0 ? (
        <div className="lr-material-recent" aria-label="Recent colours">
          <strong>Recent</strong>
          <div>
            {recent.map((entry) => (
              <button
                key={entry.color}
                type="button"
                data-testid={`material-recent-${entry.color.slice(1)}`}
                title={entry.color}
                onClick={() => {
                  syncFromMaterialColor(entry.color);
                  onApplyColour(entry.color);
                }}
              >
                <i style={{ background: entry.color }} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
