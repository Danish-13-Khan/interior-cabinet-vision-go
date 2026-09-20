import type { ExtractionResult, ExtractScaleTrust, NormalizedFloorplan } from "../../domain/floorplanExtract";

type Props = {
  draft: ExtractionResult;
  trust: ExtractScaleTrust;
  normalized: NormalizedFloorplan;
  acceptThin: boolean;
  busy: boolean;
  onAcceptThin: (value: boolean) => void;
};

const SCALE_COPY: Record<ExtractScaleTrust["status"], string> = {
  unknown: "Scale unknown — measure a known length before Apply",
  assumed: "Scale assumed from drawing units — measure a known length before Apply",
  calibrated: "Scale calibrated",
};

export function FloorplanExtractReviewIssues(props: Props) {
  const { draft, trust, normalized } = props;
  const counts = [
    ["Walls", draft.polygons.walls.length],
    ["Rooms", draft.polygons.rooms.length],
    ["Doors", draft.polygons.doors.length],
    ["Windows", draft.polygons.windows.length],
  ] as const;
  const trimmed = Object.values(normalized.openingAttachments)
    .filter((a) => a.status === "matched" && a.trimmed).length;
  const calibratedCopy = trust.referenceLengthMm
    ? `${SCALE_COPY.calibrated} (${Math.round(trust.referenceLengthMm)} mm reference)`
    : SCALE_COPY.calibrated;

  return (
    <>
      <p
        data-testid="lr-floorplan-scale-status"
        data-status={trust.status}
        className={`lr-floorplan-scale-chip is-${trust.status}`}
      >
        {trust.status === "calibrated" ? calibratedCopy : SCALE_COPY[trust.status]}
      </p>
      <p
        data-testid="lr-floorplan-extract-counts"
        className={draft.polygons.walls.length ? "lr-floorplan-counts is-ok" : "lr-floorplan-counts"}
      >
        {counts.map(([label, n]) => `${label} ${n}`).join(" · ")}
      </p>
      <label>
        <input
          type="checkbox"
          checked={props.acceptThin}
          disabled={props.busy}
          onChange={(e) => props.onAcceptThin(e.target.checked)}
        />
        Accept thickening walls under 150 mm
      </label>
      {trimmed ? (
        <p data-testid="lr-floorplan-trimmed-openings" className="lr-floorplan-issue is-note">
          {trimmed} opening(s) trimmed to host walls — red segments on overlay (before Apply).
        </p>
      ) : null}
      {normalized.issues.length ? (
        <ul data-testid="lr-floorplan-extract-issues">
          {normalized.issues.map((issue, i) => (
            <li
              key={`${issue.code}-${i}`}
              className={issue.blocksApply ? "lr-floorplan-issue is-block" : "lr-floorplan-issue is-note"}
            >
              {issue.blocksApply ? "Block: " : "Note: "}{issue.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="lr-floorplan-counts is-ok">Geometry gates passed.</p>
      )}
    </>
  );
}
