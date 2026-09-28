import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react";
import type { CabinetInstance } from "../domain/cabinetDimensions";

type ViewMode = "3d" | "front" | "plan";

export function EngineeringCabinetViewport({
  cabinet,
  mode,
}: {
  cabinet: CabinetInstance;
  mode: ViewMode;
}) {
  const drag = useRef<{ x: number; y: number; pitch: number; yaw: number } | null>(null);
  const [orbit, setOrbit] = useState({ pitch: 8, yaw: -22, scale: 1 });
  const dimensions = cabinet.config.dimensions;
  const composition = cabinet.config.composition;
  const dividerCount = composition?.dividers.count ?? 0;
  const shelfCount = composition?.shelves.count ?? cabinet.config.shelfCount;
  const doorCount = composition?.doors.enabled ? composition.doors.count : 0;
  const modelStyle = {
    "--cabinet-ratio": String(Math.max(0.85, dimensions.width / Math.max(1, dimensions.height))),
    "--cabinet-depth": `${Math.max(40, Math.min(110, dimensions.depth / 5))}px`,
    ...(mode === "3d"
      ? { transform: `perspective(1100px) rotateX(${orbit.pitch}deg) rotateY(${orbit.yaw}deg) scale(${orbit.scale})` }
      : {}),
  } as CSSProperties;

  function beginOrbit(event: ReactPointerEvent<HTMLDivElement>) {
    if (mode !== "3d" || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, pitch: orbit.pitch, yaw: orbit.yaw };
  }

  function updateOrbit(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current || mode !== "3d") return;
    setOrbit((current) => ({
      ...current,
      pitch: Math.max(-26, Math.min(32, drag.current!.pitch - (event.clientY - drag.current!.y) * 0.2)),
      yaw: drag.current!.yaw + (event.clientX - drag.current!.x) * 0.28,
    }));
  }

  return (
    <div
      className={`er-preview er-preview-live er-preview-${mode}`}
      aria-label={`${mode} interactive preview of ${cabinet.name}`}
      data-testid="engineering-cabinet-preview"
      onPointerDown={beginOrbit}
      onPointerMove={updateOrbit}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onWheel={(event: WheelEvent<HTMLDivElement>) => {
        if (mode !== "3d") return;
        event.preventDefault();
        setOrbit((current) => ({
          ...current,
          scale: Math.max(0.7, Math.min(1.45, current.scale - event.deltaY * 0.001)),
        }));
      }}
    >
      <div className="er-cabinet-model" data-testid="engineering-cabinet-model" style={modelStyle}>
        <div className="er-cabinet-face">
          {Array.from({ length: dividerCount }, (_, index) => (
            <i key={`divider-${index}`} className="er-divider" style={{ left: `${((index + 1) / (dividerCount + 1)) * 100}%` }} />
          ))}
          {Array.from({ length: shelfCount }, (_, index) => (
            <i key={`shelf-${index}`} className="er-shelf" style={{ top: `${((index + 1) / (shelfCount + 1)) * 100}%` }} />
          ))}
          {Array.from({ length: doorCount }, (_, index) => (
            <i key={`door-${index}`} className="er-door" style={{ left: `${(index / doorCount) * 100}%`, width: `${100 / doorCount}%` }} />
          ))}
        </div>
        <div className="er-cabinet-side" />
        <div className="er-cabinet-top" />
      </div>
      <span className="er-preview-dimension er-preview-width">{dimensions.width} mm</span>
      <span className="er-preview-dimension er-preview-height">{dimensions.height} mm</span>
      {mode === "3d" ? <span className="er-preview-dimension er-preview-depth">{dimensions.depth} mm deep</span> : null}
      <div className="er-orbit-hint">{mode === "3d" ? "Drag to rotate · Scroll to zoom" : mode === "front" ? "Front elevation" : "Plan view"}</div>
    </div>
  );
}
