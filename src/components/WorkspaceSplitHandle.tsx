import { useEffect, useRef, useState, type RefObject } from "react";

type WorkspaceSplitHandleProps = {
  axis: "x" | "y";
  valuePct: number;
  minPct?: number;
  maxPct?: number;
  containerRef: RefObject<HTMLElement | null>;
  ariaLabel: string;
  className?: string;
  onChange: (valuePct: number) => void;
};

export function WorkspaceSplitHandle({
  axis,
  valuePct,
  minPct = 28,
  maxPct = 72,
  containerRef,
  ariaLabel,
  className = "",
  onChange,
}: WorkspaceSplitHandleProps) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ pointer: 0, value: valuePct });

  useEffect(() => {
    if (!dragging) return;

    function onMove(event: PointerEvent) {
      const box = containerRef.current?.getBoundingClientRect();
      if (!box) return;
      const size = axis === "x" ? box.width : box.height;
      if (size <= 0) return;
      const pointer = axis === "x" ? event.clientX : event.clientY;
      const deltaPx = pointer - startRef.current.pointer;
      const next = startRef.current.value + (deltaPx / size) * 100;
      onChange(Math.min(maxPct, Math.max(minPct, Math.round(next))));
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
  }, [axis, containerRef, dragging, maxPct, minPct, onChange]);

  return (
    <div
      className={`workspace-split-handle workspace-split-handle-${axis} ${dragging ? "is-dragging" : ""} ${className}`}
      role="separator"
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-label={ariaLabel}
      aria-valuenow={valuePct}
      aria-valuemin={minPct}
      aria-valuemax={maxPct}
      tabIndex={0}
      onPointerDown={(event) => {
        event.preventDefault();
        startRef.current = {
          pointer: axis === "x" ? event.clientX : event.clientY,
          value: valuePct,
        };
        setDragging(true);
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 5 : 2;
        if (axis === "x") {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            onChange(Math.min(maxPct, Math.max(minPct, valuePct - step)));
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            onChange(Math.min(maxPct, Math.max(minPct, valuePct + step)));
          }
        } else {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            onChange(Math.min(maxPct, Math.max(minPct, valuePct - step)));
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            onChange(Math.min(maxPct, Math.max(minPct, valuePct + step)));
          }
        }
      }}
    />
  );
}
