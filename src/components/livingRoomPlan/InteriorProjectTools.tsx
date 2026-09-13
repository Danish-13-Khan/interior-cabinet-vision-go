import { InteriorCompanyPanel } from "./InteriorCompanyPanel";
import { InteriorClientPanel } from "./InteriorClientPanel";
import { useRef, useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import { measureInteriorEstimate, interiorEstimateSummary } from "../../domain/interiorEstimate/measure";
import { readInteriorEstimate, writeInteriorEstimate, patchEstimateLine, type EstimateUnit } from "../../domain/interiorEstimate/state";
import { applySurfaceFinish, SURFACE_FINISHES } from "../../domain/livingRoom/surfaceFinishes";
import { usePriceBook } from "../../hooks/usePriceBook";
import { InteriorPaymentsPanel } from "./InteriorPaymentsPanel";
import { InteriorEstimateRates } from "./InteriorEstimateRates";
import { rateCategoryLabel } from "../../domain/interiorEstimate/categories";
import "./interiorProjectTools.css";
export type ProjectToolsProps = { project: InteriorProject; onPatchDocument: (update: (project: InteriorProject) => InteriorProject) => void };

export function InteriorProjectTools(props: ProjectToolsProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState("Estimate");
  return <><button type="button" onClick={() => dialog.current?.showModal()}>Project tools</button>
    <dialog ref={dialog} className="interior-project-tools" aria-labelledby="project-tools-title">
      <header><div><h2 id="project-tools-title">{props.project.name} · Project tools</h2><p>Design details, your rates and commercial records.</p></div><button type="button" onClick={() => dialog.current?.close()} aria-label="Close project tools">Close</button></header>
      <nav aria-label="Project tools sections">{["Estimate", "Finishes", "Price book", "Client", "Payments", "Company"].map(name => <button type="button" key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>)}</nav>
      {tab === "Estimate" && <InteriorEstimatePanel {...props} />}
      {tab === "Finishes" && <InteriorFinishesPanel {...props} />}
      {tab === "Price book" && <InteriorPriceBookPanel />}
      {tab === "Client" && <InteriorClientPanel {...props} />}
      {tab === "Company" && <InteriorCompanyPanel project={props.project} />}
      {tab === "Payments" && <InteriorPaymentsPanel project={props.project} />}
    </dialog></>;
}
function InteriorEstimatePanel({ project, onPatchDocument }: ProjectToolsProps) {
  const state = readInteriorEstimate(project), rows = measureInteriorEstimate(project), summary = interiorEstimateSummary(project);
  const [label, setLabel] = useState(""), [unit, setUnit] = useState<EstimateUnit>("each");
  const [qty, setQty] = useState(1), [rate, setRate] = useState(0);
  return <section><h3>Whole-interior estimate</h3><p>Cabinet costs remain in the existing cabinet engine. These additional quantities use your own rates. Whole-room finishes include full coverage; exclude them when pricing a custom finish breakdown.</p>
    <label><input type="checkbox" checked={state.enabled} onChange={e => onPatchDocument(p => writeInteriorEstimate(p, { ...readInteriorEstimate(p), enabled: e.target.checked }))} /> Include all rooms and interior items in the proposal</label>
    <p role="status">Additional cost: {summary.total.toLocaleString()} · {summary.missing.length} items need a rate or explicit exclusion. Markup, discount and tax apply in the proposal.</p>
    {summary.conflicts.map(conflict => <p key={`${conflict.category}:${conflict.kind}`} role="alert">Possible double charge · {conflict.message} Exclude one side if it is not intended.</p>)}
    <InteriorEstimateRates lines={rows} onPatchDocument={onPatchDocument} />
    <div className="ipt-table"><table><thead><tr><th>Include</th><th>Room / item</th><th>Quantity</th><th>Waste %</th><th>Rate / unit</th><th>Cost</th><th /></tr></thead><tbody>{rows.map(row => <tr key={row.id}>
      <td><input type="checkbox" aria-label={`Include ${row.roomName} ${row.label}`} checked={!row.excluded} onChange={e => onPatchDocument(p => patchEstimateLine(p, row.id, { excluded: !e.target.checked }))} /></td>
      <td><strong>{row.label}</strong><small>{row.roomName}</small><details><summary>Measurement</summary>{row.source}</details></td><td>{row.quantity} {row.unit}</td>
      <td><input aria-label={`Waste for ${row.id}`} type="number" min="0" max="100" value={row.wastePercent} onChange={e => onPatchDocument(p => patchEstimateLine(p, row.id, { wastePercent: Number(e.target.value) }))} /></td>
      <td><input aria-label={`Rate for ${row.id}`} type="number" min="0" placeholder="Required" value={row.rate ?? ""} onChange={e => { const value = e.target.value; onPatchDocument(p => patchEstimateLine(p, row.id, { rate: value === "" ? undefined : Number(value) })); }} />{row.rateSource === "category" && <small>From {rateCategoryLabel(row.category)} rate</small>}</td><td>{row.amount.toLocaleString()}</td>
      <td>{row.id.startsWith("manual:") && <button type="button" onClick={() => onPatchDocument(p => { const s = readInteriorEstimate(p); return writeInteriorEstimate(p, { ...s, manual: s.manual.filter(l => `manual:${l.id}` !== row.id) }); })}>Remove</button>}</td>
    </tr>)}</tbody></table></div>
    <form onSubmit={e => { e.preventDefault(); if (!label.trim()) return; const item = { id: crypto.randomUUID(), roomId: project.activeRoomId, label: label.trim(), unit, quantity: qty, rate }; onPatchDocument(p => { const s = readInteriorEstimate(p); return writeInteriorEstimate(p, { ...s, manual: [...s.manual, item] }); }); setLabel(""); }}>
      <h4>Custom cost item · active room</h4><div className="ipt-fields"><label>Description<input required value={label} onChange={e => setLabel(e.target.value)} /></label><label>Unit<select value={unit} onChange={e => setUnit(e.target.value as EstimateUnit)}><option value="each">Each</option><option value="m2">Square metre</option><option value="lm">Linear metre</option></select></label><label>Quantity<input type="number" min="0.0001" step="any" required value={qty} onChange={e => setQty(Number(e.target.value))} /></label><label>Rate<input type="number" min="0" step="any" required value={rate} onChange={e => setRate(Number(e.target.value))} /></label><button>Add cost item</button></div>
    </form></section>;
}
function InteriorFinishesPanel({ project, onPatchDocument }: ProjectToolsProps) {
  return <section><h3>Material finish library</h3><p>Changing a shared material updates every object and surface using it. Existing texture maps are preserved.</p><div className="ipt-materials">{project.materials.map(material => <article key={material.id}><h4>{material.name}</h4><label>Finish<select aria-label={`Finish for ${material.name}`} value={String(material.extensions?.surfaceFinish ?? "")} onChange={e => onPatchDocument(p => applySurfaceFinish(p, material.id, e.target.value))}><option value="" disabled>Custom material</option>{SURFACE_FINISHES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label><label>Colour<input type="color" value={/^#[0-9a-f]{6}$/i.test(material.color) ? material.color : "#ffffff"} onChange={e => { const color = e.target.value; onPatchDocument(p => ({ ...p, materials: p.materials.map(m => m.id === material.id ? { ...m, color } : m) })); }} /></label><small>Roughness {material.roughness} · Metalness {material.metalness}</small></article>)}</div></section>;
}
function InteriorPriceBookPanel() {
  const { priceBook: book, save, canEdit } = usePriceBook();
  return <section><h3>Your cabinet price book</h3><p>Local rates used by the quote engine. Frozen proposals retain their issued values. Saving rates changes live quotes.</p>{!canEdit && <p>A paid plan is required to edit rates.</p>}
    <fieldset disabled={!canEdit}><div className="ipt-materials">
      <article><h4>Boards · per m²</h4>{book.boards.map((r, i) => <label key={`${r.materialId}:${r.thicknessMm}`}>{r.materialId} · {r.thicknessMm} mm<input type="number" min="0" value={r.costPerM2} onChange={e => save({ boards: book.boards.map((v,j) => i === j ? { ...v, costPerM2: Number(e.target.value) } : v) })} /></label>)}</article>
      <article><h4>Finishes · per m²</h4>{book.finishes.map((r,i) => <label key={r.finishId}>{r.finishId}<input type="number" min="0" value={r.costPerM2} onChange={e => save({ finishes: book.finishes.map((v,j) => i === j ? { ...v, costPerM2: Number(e.target.value) } : v) })} /></label>)}<h4>Edges · per metre</h4>{book.edges.map((r,i) => <label key={r.edgeBandingId}>{r.edgeBandingId}<input type="number" min="0" value={r.costPerM} onChange={e => save({ edges: book.edges.map((v,j) => i === j ? { ...v, costPerM: Number(e.target.value) } : v) })} /></label>)}</article>
      <article><h4>Hardware · each</h4>{book.hardware.map((r,i) => <label key={r.hardwareId}>{r.hardwareId}<input type="number" min="0" value={r.costPerUnit} onChange={e => save({ hardware: book.hardware.map((v,j) => i === j ? { ...v, costPerUnit: Number(e.target.value) } : v) })} /></label>)}</article>
      <article><h4>Labour</h4>{Object.entries(book.labour).map(([key,value]) => <label key={key}>{key}<input type="number" min="0" value={value} onChange={e => save({ labour: { ...book.labour, [key]: Number(e.target.value) } })} /></label>)}<h4>Quote defaults</h4>{Object.entries(book.quoteDefaults).map(([key,value]) => <label key={key}>{key}<input type="number" min="0" value={value} onChange={e => save({ quoteDefaults: { ...book.quoteDefaults, [key]: Number(e.target.value) } })} /></label>)}</article>
    </div></fieldset></section>;
}
