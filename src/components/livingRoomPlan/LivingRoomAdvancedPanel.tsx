import { useMemo, useState } from "react";
import type { InteriorProject, Size3Mm } from "../../domain/interiorProject";
import {
  clientShareBrief,
  estimateVendorPricing,
  getAdvancedStudioState,
  listLayoutSuggestions,
  recognizePlanUnderlay,
  type AdvancedStudioState,
  type LivingRoomCatalogId,
  type LivingRoomPlanUnderlay,
} from "../../domain/livingRoom";

type Props = {
  project: InteriorProject;
  underlay: LivingRoomPlanUnderlay | null;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onAddCatalogObject: (id: LivingRoomCatalogId) => void;
  onUpdateState: (state: AdvancedStudioState) => void;
};

export function LivingRoomAdvancedPanel({ project, underlay, onRoomDimensions, onAddCatalogObject, onUpdateState }: Props) {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const state = getAdvancedStudioState(project);
  const room = project.rooms.find((item) => item.id === project.activeRoomId) ?? project.rooms[0]!;
  const recognition = recognizePlanUnderlay(underlay, room.dimensions);
  const suggestions = useMemo(() => listLayoutSuggestions(project), [project]);
  const estimates = useMemo(() => estimateVendorPricing(project), [project]);
  const update = (patch: Partial<AdvancedStudioState>) => onUpdateState({ ...state, ...patch });

  return <aside className="lr-catalog lr-studio-panel lr-advanced-panel">
    <div className="context-panel-heading"><strong>Advanced Studio</strong><span>Assist, coordinate &amp; share</span></div>
    <section><strong>AI plan recognition</strong><small>{recognition.message}</small><button type="button" disabled={!underlay} onClick={() => onRoomDimensions(recognition.dimensions)}>Apply {recognition.confidence}% draft fit</button></section>
    <section><strong>AI layout suggestions</strong>{suggestions.map((item) => <div key={item.id}><b>{item.title}</b><small>{item.detail}</small><button type="button" onClick={() => item.catalogIds.forEach(onAddCatalogObject)}>Place suggestion</button></div>)}</section>
    <section><strong>Floor stack</strong>{state.floors.map((floor) => <span key={floor.id}>{floor.name}</span>)}<button type="button" onClick={() => update({ floors: [...state.floors, { id: `floor-${state.floors.length + 1}`, name: `Floor ${state.floors.length + 1}` }] })}>+ Add floor</button></section>
    <section><strong>Vendor pricing</strong>{estimates.map((item) => <span key={item.vendor}>{item.vendor}<b>{item.currency} {item.total.toLocaleString()}</b></span>)}</section>
    <section><strong>Collaboration</strong><div><input value={note} placeholder="Add review note" onChange={(event) => setNote(event.target.value)} /><button type="button" disabled={!note.trim()} onClick={() => { update({ reviewNotes: [...state.reviewNotes, { id: crypto.randomUUID(), text: note.trim(), createdAt: new Date().toISOString() }] }); setNote(""); }}>Add</button></div>{state.reviewNotes.slice(-3).reverse().map((item) => <small key={item.id}>• {item.text}</small>)}</section>
    <section><strong>Client portal</strong><small>Copy a portal-ready brief, then send the Client Package from Render Studio.</small><button type="button" onClick={() => void navigator.clipboard?.writeText(clientShareBrief(project, state)).then(() => setCopied(true))}>{copied ? "Brief copied" : "Copy client brief"}</button></section>
  </aside>;
}
