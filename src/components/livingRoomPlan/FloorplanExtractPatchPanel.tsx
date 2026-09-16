import { useMemo, useState } from "react";
import type { ExtractionResult, PolygonGroup } from "../../domain/floorplanExtract";

type Props = {
  draft: ExtractionResult;
  busy: boolean;
  onDelete: (group: PolygonGroup, id: string) => void;
  onUpsertJson: (group: PolygonGroup, polygonJson: string) => void;
  onSetWallHeight: (heightM: number) => void;
};

const GROUPS: PolygonGroup[] = ["walls", "rooms", "doors", "windows", "stairs"];

function listGroup(draft: ExtractionResult, group: PolygonGroup) {
  if (group === "stairs") return draft.polygons.stairs ?? [];
  return draft.polygons[group];
}

export function FloorplanExtractPatchPanel(props: Props) {
  const [group, setGroup] = useState<PolygonGroup>("walls");
  const [selectedId, setSelectedId] = useState<string>("");
  const [polygonJson, setPolygonJson] = useState(
    '{\n  "id": "wall-new",\n  "outer": [[0,0],[2,0],[2,0.2],[0,0.2]]\n}',
  );
  const [wallHeight, setWallHeight] = useState(String(props.draft.defaults?.wall_height_m ?? 2.7));

  const items = useMemo(() => listGroup(props.draft, group), [props.draft, group]);

  return (
    <section data-testid="lr-floorplan-patch-panel" aria-label="Draft polygon patch">
      <strong>Edit draft (via /geometry/patch)</strong>
      <label>
        Group
        <select data-testid="lr-floorplan-patch-group" value={group} disabled={props.busy}
          onChange={(e) => { setGroup(e.target.value as PolygonGroup); setSelectedId(""); }}>
          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>
      <ul data-testid="lr-floorplan-patch-list" style={{ maxHeight: 120, overflow: "auto" }}>
        {items.map((p, i) => {
          const id = p.id ?? `(unnamed-${i})`;
          return (
            <li key={`${group}-${id}-${i}`}>
              <button type="button" disabled={props.busy}
                onClick={() => {
                  setSelectedId(p.id ?? "");
                  setPolygonJson(JSON.stringify(p, null, 2));
                }}>
                {id}
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" data-testid="lr-floorplan-patch-delete" disabled={props.busy || !selectedId}
        onClick={() => selectedId && props.onDelete(group, selectedId)}>
        Delete selected
      </button>
      <label>
        Upsert polygon JSON
        <textarea data-testid="lr-floorplan-patch-json" rows={6} value={polygonJson} disabled={props.busy}
          onChange={(e) => setPolygonJson(e.target.value)} style={{ width: "100%", fontFamily: "monospace" }} />
      </label>
      <button type="button" data-testid="lr-floorplan-patch-upsert" disabled={props.busy}
        onClick={() => props.onUpsertJson(group, polygonJson)}>
        Upsert polygon
      </button>
      <label>
        defaults.wall_height_m
        <input value={wallHeight} disabled={props.busy} onChange={(e) => setWallHeight(e.target.value)} />
      </label>
      <button type="button" disabled={props.busy} onClick={() => {
        const h = Number(wallHeight);
        if (!(h > 0)) return;
        props.onSetWallHeight(h);
      }}>
        Set wall height
      </button>
    </section>
  );
}
