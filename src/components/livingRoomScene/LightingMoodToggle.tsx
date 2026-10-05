import type { InteriorProject } from "../../domain/interiorProject";
import { readLightingMood, writeLightingMood } from "../../domain/livingRoom/lightingMood";

/** Day / Evening for the 3D view. Evening dims the room so placed fixtures carry it. */
export function LightingMoodToggle(props: {
  project: InteriorProject;
  onPatchDocument: (update: (current: InteriorProject) => InteriorProject, status: string) => void;
}) {
  const evening = readLightingMood(props.project) === "evening";
  return (
    <button
      type="button"
      className={evening ? "is-active" : ""}
      data-testid="model-lighting-mood"
      aria-pressed={evening}
      title="Evening dims daylight so your cove, panel and track lights light the room. Saved with the project."
      onClick={() => props.onPatchDocument(
        (current) => writeLightingMood(current, evening ? "day" : "evening"),
        evening ? "Daylight on." : "Evening lighting on.",
      )}
    >
      Evening
    </button>
  );
}
