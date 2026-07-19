import { useState } from "react";
import type { RoomDoor, RoomWindow } from "../domain/roomModel";

type DoorWindowEditorProps = {
  doors: RoomDoor[];
  windows: RoomWindow[];
  onChangeDoors: (doors: RoomDoor[]) => void;
  onChangeWindows: (windows: RoomWindow[]) => void;
};

export function DoorWindowEditor({ doors, windows, onChangeDoors, onChangeWindows }: DoorWindowEditorProps) {
  const [addType, setAddType] = useState<"door" | "window">("door");

  function add() {
    const id = addType + "-" + Date.now();
    if (addType === "door") {
      onChangeDoors([...doors, {
        id, side: "back-wall", positionMm: 0, widthMm: 900, heightMm: 2100, swingDirection: "in" as const,
      }]);
    } else {
      onChangeWindows([...windows, {
        id, side: "back-wall", positionMm: 0, widthMm: 1200, heightMm: 1200, sillHeightMm: 900,
      }]);
    }
  }

  function remove(item: RoomDoor | RoomWindow, isDoor: boolean) {
    if (isDoor) onChangeDoors(doors.filter(d => d.id !== item.id));
    else onChangeWindows(windows.filter(w => w.id !== item.id));
  }

  function updateDoor(id: string, patch: Partial<RoomDoor>) {
    onChangeDoors(doors.map(d => d.id === id ? { ...d, ...patch } : d));
  }

  function updateWindow(id: string, patch: Partial<RoomWindow>) {
    onChangeWindows(windows.map(w => w.id === id ? { ...w, ...patch } : w));
  }

  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Doors & Windows</h2>
      </div>

      {doors.map(d => (
        <div key={d.id} className="dw-item">
          <span className="dw-label">Door</span>
          <select value={d.side} onChange={e => updateDoor(d.id, { side: e.target.value as RoomDoor["side"] })}>
            <option value="back-wall">Back Wall</option>
            <option value="left-wall">Left Wall</option>
            <option value="right-wall">Right Wall</option>
          </select>
          <input type="number" value={d.widthMm} onChange={e => updateDoor(d.id, { widthMm: Number(e.target.value) })} placeholder="W" />
          <input type="number" value={d.heightMm} onChange={e => updateDoor(d.id, { heightMm: Number(e.target.value) })} placeholder="H" />
          <input type="number" value={d.positionMm} onChange={e => updateDoor(d.id, { positionMm: Number(e.target.value) })} placeholder="Pos" />
          <button type="button" onClick={() => remove(d, true)} className="dw-remove">x</button>
        </div>
      ))}

      {windows.map(w => (
        <div key={w.id} className="dw-item">
          <span className="dw-label">Window</span>
          <select value={w.side} onChange={e => updateWindow(w.id, { side: e.target.value as RoomWindow["side"] })}>
            <option value="back-wall">Back Wall</option>
            <option value="left-wall">Left Wall</option>
            <option value="right-wall">Right Wall</option>
          </select>
          <input type="number" value={w.widthMm} onChange={e => updateWindow(w.id, { widthMm: Number(e.target.value) })} placeholder="W" />
          <input type="number" value={w.heightMm} onChange={e => updateWindow(w.id, { heightMm: Number(e.target.value) })} placeholder="H" />
          <input type="number" value={w.sillHeightMm} onChange={e => updateWindow(w.id, { sillHeightMm: Number(e.target.value) })} placeholder="Sill" />
          <input type="number" value={w.positionMm} onChange={e => updateWindow(w.id, { positionMm: Number(e.target.value) })} placeholder="Pos" />
          <button type="button" onClick={() => remove(w, false)} className="dw-remove">x</button>
        </div>
      ))}

      <div className="dw-add">
        <select value={addType} onChange={e => setAddType(e.target.value as "door" | "window")}>
          <option value="door">Door</option>
          <option value="window">Window</option>
        </select>
        <button type="button" onClick={add}>Add</button>
      </div>
    </div>
  );
}
