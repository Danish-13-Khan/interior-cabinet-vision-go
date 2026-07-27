import React, { useMemo } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import { getFootprintDimensions, usesRotatedFootprint } from "../domain/cabinetDimensions";
import type { CountertopSegment } from "../domain/cabinetLibrary";
import type { RoomConfig } from "../domain/roomModel";

type TwoDViewProps = {
  project: CabinetProject;
  room: RoomConfig;
  view: "top" | "front" | "side";
  countertops?: CountertopSegment[];
};

const SCALE = 3;
const MARGIN = 40;

export function TwoDView({ project, room, view, countertops }: TwoDViewProps) {
  const { svgWidth, svgHeight, elements } = useMemo(() => {
    const rw = room.dimensions.widthMm;
    const rd = room.dimensions.depthMm;
    const rh = room.dimensions.heightMm;

    if (view === "top") {
      const w = rw / SCALE + MARGIN * 2;
      const h = rd / SCALE + MARGIN * 2;
      const ox = MARGIN + rw / SCALE / 2;
      const oy = MARGIN + rd / SCALE / 2;
      const els: React.ReactElement[] = [];

      els.push(<rect key="room" x={ox - rw / SCALE / 2} y={oy - rd / SCALE / 2}
        width={rw / SCALE} height={rd / SCALE} fill="#f0f3f6" stroke="#94a3b8" strokeWidth={2} />);

      for (const cab of project.cabinets) {
        const rot = usesRotatedFootprint(cab.placement.rotation);
        const fp = getFootprintDimensions(cab.config.dimensions, cab.placement.rotation);
        const cx = ox + cab.placement.x / SCALE;
        const cy = oy + cab.placement.z / SCALE;
        const bw = fp.width / SCALE;
        const bd = fp.depth / SCALE;
        const color = rot ? "#d5b07c" : "#c9a46b";
        els.push(<rect key={cab.id} x={cx - bw / 2} y={cy - bd / 2}
          width={bw} height={bd} fill={color} stroke="#8b7355" strokeWidth={1} rx={2} />);
        els.push(<text key={`${cab.id}-l`} x={cx} y={cy} textAnchor="middle"
          dominantBaseline="central" fontSize={8} fill="#3d3224" fontWeight={600}>
          {cab.name.length > 8 ? cab.name.slice(0, 7) + "\u2026" : cab.name}</text>);
      }

      for (const door of room.doors) {
        const dx = door.side === "back-wall" ? ox + door.positionMm / SCALE
          : door.side === "left-wall" ? ox - rw / SCALE / 2 - 6 : ox + rw / SCALE / 2 + 2;
        const dy = door.side === "back-wall" ? oy - rd / SCALE / 2 - 6 : oy + door.positionMm / SCALE;
        const dw = door.side === "back-wall" ? door.widthMm / SCALE : 4;
        const dh = door.side === "back-wall" ? 4 : door.widthMm / SCALE;
        els.push(<rect key={door.id} x={dx - dw / 2} y={dy - dh / 2} width={dw} height={dh}
          fill="#d4e6f1" stroke="#5b8def" strokeWidth={1} rx={1} />);
      }
      for (const win of room.windows) {
        const wx = win.side === "back-wall" ? ox + win.positionMm / SCALE
          : win.side === "left-wall" ? ox - rw / SCALE / 2 - 6 : ox + rw / SCALE / 2 + 2;
        const wy = win.side === "back-wall" ? oy - rd / SCALE / 2 - 6 : oy + win.positionMm / SCALE;
        const ww = win.side === "back-wall" ? win.widthMm / SCALE : 4;
        const wh = win.side === "back-wall" ? 4 : win.widthMm / SCALE;
        els.push(<rect key={win.id} x={wx - ww / 2} y={wy - wh / 2} width={ww} height={wh}
          fill="#a8d8ea" stroke="#3b9fce" strokeWidth={1} rx={1} />);
      }

      for (const ct of countertops ?? []) {
        const cx = ox + ct.positionX / SCALE;
        const cz = oy + ct.positionZ / SCALE;
        els.push(<rect key={ct.id} x={cx - ct.widthMm / SCALE / 2} y={cz - ct.depthMm / SCALE / 2}
          width={ct.widthMm / SCALE} height={ct.depthMm / SCALE}
          fill="none" stroke="#6c8a5a" strokeWidth={2} strokeDasharray="4 2" rx={2} />);
      }

      return { svgWidth: w, svgHeight: h, elements: els };
    }

    if (view === "front") {
      const w = rw / SCALE + MARGIN * 2;
      const h = rh / SCALE + MARGIN * 2;
      const ox = MARGIN + rw / SCALE / 2;
      const oy = MARGIN + rh / SCALE / 2;
      const els: React.ReactElement[] = [];

      els.push(<rect key="room" x={ox - rw / SCALE / 2} y={oy - rh / SCALE / 2}
        width={rw / SCALE} height={rh / SCALE} fill="#f8fafb" stroke="#94a3b8" strokeWidth={2} />);
      els.push(<line key="floor" x1={ox - rw / SCALE / 2} y1={oy + rh / SCALE / 2}
        x2={ox + rw / SCALE / 2} y2={oy + rh / SCALE / 2} stroke="#64748b" strokeWidth={1} />);

      for (const cab of project.cabinets) {
        if (cab.placement.attachment !== "floor") continue;
        const cx = ox + cab.placement.x / SCALE;
        const bottom = oy + rh / SCALE / 2;
        const ch = cab.config.dimensions.height / SCALE;
        const cw = cab.config.dimensions.width / SCALE;
        els.push(<rect key={cab.id} x={cx - cw / 2} y={bottom - ch}
          width={cw} height={ch} fill="#c9a46b" stroke="#8b7355" strokeWidth={1} />);
      }

      return { svgWidth: w, svgHeight: h, elements: els };
    }

    const w = rd / SCALE + MARGIN * 2;
    const h = rh / SCALE + MARGIN * 2;
    const ox = MARGIN + rd / SCALE / 2;
    const oy = MARGIN + rh / SCALE / 2;
    const els: React.ReactElement[] = [];
    els.push(<rect key="room" x={ox - rd / SCALE / 2} y={oy - rh / SCALE / 2}
      width={rd / SCALE} height={rh / SCALE} fill="#f8fafb" stroke="#94a3b8" strokeWidth={2} />);
    els.push(<line key="floor" x1={ox - rd / SCALE / 2} y1={oy + rh / SCALE / 2}
      x2={ox + rd / SCALE / 2} y2={oy + rh / SCALE / 2} stroke="#64748b" strokeWidth={1} />);

    for (const cab of project.cabinets) {
      if (cab.placement.attachment !== "floor") continue;
      const cz = ox + cab.placement.z / SCALE;
      const bottom = oy + rh / SCALE / 2;
      const ch = cab.config.dimensions.height / SCALE;
      const cd = cab.config.dimensions.depth / SCALE;
      els.push(<rect key={cab.id} x={cz - cd / 2} y={bottom - ch}
        width={cd} height={ch} fill="#c9a46b" stroke="#8b7355" strokeWidth={1} />);
    }

    return { svgWidth: w, svgHeight: h, elements: els };
  }, [project, room, view, countertops]);

  return (
    <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ background: "#fafcfd", borderRadius: 12, border: "1px solid #c8d1db" }}>
      {elements}
    </svg>
  );
}
