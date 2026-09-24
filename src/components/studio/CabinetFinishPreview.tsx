import { useEffect, useState } from "react";
import { cabinetFinishId } from "../../domain/livingRoom/cabinetFinish";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import { useFinishPreview } from "./finishPreviewContext";

const FINISHES = [
  ["wood-oak", "Oak"],
  ["wood-walnut", "Walnut"],
  ["white-matte", "White matte"],
  ["grey", "Grey"],
] as const;

export function CabinetFinishPreview(props: {
  object: InteriorObjectEntity;
  project: InteriorProject;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
}) {
  const saved = cabinetFinishId(props.object);
  const setOverrides = useFinishPreview()?.setOverrides;
  const [draft, setDraft] = useState(saved);
  const [scope, setScope] = useState<"cabinet" | "room">("cabinet");
  const [previewed, setPreviewed] = useState<Record<string, string> | null>(null);
  const [objectId, setObjectId] = useState(props.object.id);
  if (objectId !== props.object.id) {
    setObjectId(props.object.id);
    setDraft(cabinetFinishId(props.object));
    setPreviewed(null);
  }

  useEffect(() => {
    setOverrides?.({});
    return () => setOverrides?.({});
  }, [objectId, setOverrides]);

  function showPreview() {
    const ids = scope === "cabinet"
      ? [props.object.id]
      : props.project.objects
        .filter((item) => item.roomId === props.object.roomId && item.kind === "cabinet" && item.category !== "filler")
        .map((item) => item.id);
    const next: Record<string, string> = {};
    for (const id of ids) next[id] = draft;
    setPreviewed(next);
    setOverrides?.(next);
  }

  function savePreview() {
    if (!previewed) return;
    for (const [id, finishId] of Object.entries(previewed)) {
      props.onSetParameters(id, { finishId });
    }
    setDraft(previewed[props.object.id] ?? cabinetFinishId(props.object));
    setPreviewed(null);
    setOverrides?.({});
  }

  return (
    <label className="studio-finish-preview" data-testid="cabinet-finish-preview">
      Finish
      <select data-testid="cabinet-finish" value={draft} onChange={(event) => setDraft(event.target.value)}>
        {FINISHES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <select aria-label="Finish scope" value={scope} onChange={(event) => setScope(event.target.value as "cabinet" | "room")}>
        <option value="cabinet">This cabinet</option>
        <option value="room">Whole room</option>
      </select>
      <button type="button" onClick={showPreview}>Preview</button>
      <button type="button" disabled={!previewed} onClick={savePreview}>Save preview</button>
      <button type="button" onClick={() => {
        setDraft(saved);
        setPreviewed(null);
        setOverrides?.({});
      }}>Revert</button>
    </label>
  );
}
