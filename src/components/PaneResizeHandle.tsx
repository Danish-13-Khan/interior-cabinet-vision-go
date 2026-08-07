import { useEffect, useRef, useState } from "react";

type PaneResizeHandleProps = {
  axis: "x" | "y";
  value: number;
  min?: number;
  max?: number;
  invert?: boolean;
  ariaLabel: string;
  onChange: (value: number) => void;
};

export function PaneResizeHandle({
  axis,
  value,
  min = 180,
  max = 480,
  invert = false,
  ariaLabel,
  onChange,
}: PaneResizeHandleProps) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ pointer: 0, value });

  useEffect(() => {
    if (!dragging) return;

    function onMove(event: PointerEvent) {
      const delta =
        axis === "x"
          ? event.clientX - startRef.current.pointer
          : event.clientY - startRef.current.pointer;
      const next = startRef.current.value + (invert ? -delta : delta);
      onChange(Math.min(max, Math.max(min, Math.round(next))));
    }

    function onUp() {
      setDragging(false);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [axis, dragging, invert, max, min, onChange]);

  return (
    <div
      className={`pane-resize-handle pane-resize-${axis} ${dragging ? "is-dragging" : ""}`}
      role="separator"
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-label={ariaLabel}
      aria-valuenow={value}
      tabIndex={0}
      onPointerDown={(event) => {
        event.preventDefault();
        startRef.current = {
          pointer: axis === "x" ? event.clientX : event.clientY,
          value,
        };
        setDragging(true);
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 24 : 8;
        if (axis === "x") {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            onChange(Math.min(max, Math.max(min, value + (invert ? step : -step))));
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            onChange(Math.min(max, Math.max(min, value + (invert ? -step : step))));
          }
        } else {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            onChange(Math.min(max, Math.max(min, value + (invert ? step : -step))));
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            onChange(Math.min(max, Math.max(min, value + (invert ? -step : step))));
          }
        }
      }}
    />
  );
}
