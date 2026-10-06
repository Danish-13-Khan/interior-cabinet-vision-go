import type { OverviewCorner } from "../../domain/livingRoom/overviewCameras";
import { OVERVIEW_CORNERS, overviewCornerLabel } from "../../domain/livingRoom/overviewCameras";
import type { OverviewPhase } from "../../hooks/useApartmentOverview";
import "./ApartmentOverviewControls.css";

type ApartmentOverviewControlsProps = {
  available: boolean;
  phase: OverviewPhase;
  corner: OverviewCorner;
  roomName: string | null;
  onEnter: () => void;
  onLeave: () => void;
  onCorner: (corner: OverviewCorner) => void;
};

const PHASE_ATTR: Record<OverviewPhase, string> = {
  idle: "idle",
  "warming-in": "warming",
  overview: "overview",
  "warming-out": "warming",
};

/** Toggle, corner cameras and the warm-up veil for the whole-apartment view. */
export function ApartmentOverviewControls(props: ApartmentOverviewControlsProps) {
  if (!props.available && props.phase === "idle") return null;
  const open = props.phase === "overview" || props.phase === "warming-in";
  const warming = props.phase === "warming-in" || props.phase === "warming-out";
  return (
    <div
      className="lr-apartment-overview"
      data-testid="apartment-overview"
      data-overview-phase={PHASE_ATTR[props.phase]}
      data-overview-corner={props.corner}
      data-overview-room={props.roomName ?? ""}
    >
      <button
        type="button"
        className="lr-apartment-overview-toggle"
        data-testid="apartment-overview-toggle"
        aria-pressed={open}
        title={open ? "Back to this room (Esc)" : "See every room from above"}
        onClick={open ? props.onLeave : props.onEnter}
      >
        {open ? "This room" : "Whole apartment"}
      </button>
      {props.phase === "overview" ? OVERVIEW_CORNERS.map((corner) => (
        <button
          key={corner}
          type="button"
          data-testid={`apartment-overview-corner-${corner}`}
          aria-pressed={props.corner === corner}
          aria-label={overviewCornerLabel(corner)}
          className={props.corner === corner ? "is-active" : undefined}
          onClick={() => props.onCorner(corner)}
        >
          {corner === "top" ? "Top" : corner.toUpperCase()}
        </button>
      )) : null}
      {warming ? (
        <span className="lr-apartment-overview-status" data-testid="apartment-overview-status">
          Preparing view
        </span>
      ) : null}
      {props.phase === "overview" && props.roomName ? (
        <span className="lr-apartment-overview-status" data-testid="apartment-overview-room-name">
          {props.roomName}
        </span>
      ) : null}
    </div>
  );
}

/** Covers the canvas while the light-count change recompiles. */
export function ApartmentOverviewVeil(props: { show: boolean; onDismiss: () => void }) {
  if (!props.show) return null;
  return (
    <div
      className="lr-apartment-overview-veil"
      data-testid="apartment-overview-veil"
      onPointerDown={props.onDismiss}
      aria-hidden
    />
  );
}
