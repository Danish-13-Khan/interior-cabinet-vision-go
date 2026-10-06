import type { ShowcaseTourStop } from "../../domain/apartmentTemplates/showcaseTour";
import type { ShowcaseTourState } from "../../domain/apartmentTemplates/showcaseTourSession";
import type { LightingMood } from "../../domain/livingRoom/lightingMood";
import "./ShowcaseTourControls.css";

type ShowcaseTourControlsProps = {
  available: boolean;
  stops: readonly ShowcaseTourStop[];
  tour: ShowcaseTourState;
  mood: LightingMood;
  showMood: boolean;
  onStart: () => void;
  onStop: () => void;
  onMood: (mood: LightingMood) => void;
};

const MOODS: ReadonlyArray<{ id: LightingMood; label: string }> = [
  { id: "day", label: "Day" },
  { id: "evening", label: "Evening" },
];

/** View-only Day/Evening: the toolbar's Evening button is the one that saves to the project. */
function ShowcaseTourMoodToggle(props: { mood: LightingMood; onMood: (mood: LightingMood) => void }) {
  return (
    <span className="lr-showcase-tour-mood" role="group" aria-label="Mood (view only, not saved)">
      {MOODS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          data-testid={`showcase-tour-mood-${id}`}
          aria-pressed={props.mood === id}
          className={props.mood === id ? "is-active" : ""}
          onClick={() => props.onMood(id)}
        >
          {label}
        </button>
      ))}
    </span>
  );
}

function tourPhase(tour: ShowcaseTourState): "idle" | "preparing" | "touring" {
  if (!tour.active) return "idle";
  return tour.preparing ? "preparing" : "touring";
}

/** Tour button, progress chip and mood toggle over Model View, plus the warm-up veil. */
export function ShowcaseTourControls(props: ShowcaseTourControlsProps) {
  const { tour, stops } = props;
  if (!props.available && !tour.active) return null;
  const stop = tour.active ? stops[tour.index] : undefined;
  return (
    <>
      {tour.preparing ? (
        // Rooms flash by while they warm up; keep them out of sight until the first glide.
        <div className="lr-showcase-tour-veil" data-testid="showcase-tour-veil" onPointerDown={props.onStop} aria-hidden />
      ) : null}
      <div
        className={`lr-showcase-tour${tour.active ? " is-touring" : ""}`}
        data-testid="showcase-tour"
        data-tour-active={tour.active ? "1" : "0"}
        data-tour-phase={tourPhase(tour)}
        data-tour-stop-index={tour.index}
        data-tour-stop-count={stops.length}
        data-tour-room={tour.roomId ?? ""}
        data-tour-stop-reason={tour.lastStopReason ?? ""}
      >
        <button
          type="button"
          className="lr-showcase-tour-toggle"
          data-testid="showcase-tour-toggle"
          aria-pressed={tour.active}
          title={tour.active ? "Stop the tour (Esc)" : "Glide through every room's showcase view"}
          onClick={tour.active ? props.onStop : props.onStart}
        >
          {tour.active ? "Stop tour" : "Tour"}
        </button>
        {stop ? (
          <span className="lr-showcase-tour-status" aria-live="polite" data-testid="showcase-tour-status">
            {tour.preparing ? "Preparing tour" : stop.roomName} · {tour.index + 1}/{stops.length} · Esc to stop
          </span>
        ) : null}
        {props.showMood ? <ShowcaseTourMoodToggle mood={props.mood} onMood={props.onMood} /> : null}
      </div>
    </>
  );
}
