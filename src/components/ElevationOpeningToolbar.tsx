import type { CabinetConfig } from "../domain/cabinetDimensions";
import type { OpeningContentType } from "../domain/cabinetOpeningStructure";
import {
  ELEVATION_CONTENT_SHORT_LABELS,
  getElevationOpeningToolbarState,
  type ElevationOpeningCommand,
} from "../domain/elevationOpeningEdit";

type ElevationOpeningToolbarProps = {
  config: CabinetConfig | null;
  activeOpeningId?: string | null;
  draftingTool: "select" | "note" | "leader";
  onCommand: (command: ElevationOpeningCommand) => void;
};

export function ElevationOpeningToolbar({
  config,
  activeOpeningId = null,
  draftingTool,
  onCommand,
}: ElevationOpeningToolbarProps) {
  const state = getElevationOpeningToolbarState(config, activeOpeningId);
  if (!state.supportsOpenings || draftingTool !== "select") return null;

  return (
    <div className="elevation-opening-toolbar" role="toolbar" aria-label="Opening edit">
      <span className="elevation-opening-toolbar-meta">
        {state.activeLabel
          ? `${state.activeLabel} · ${state.leafCount}/${state.maxLeaves}`
          : "Select an opening"}
      </span>
      <div className="elevation-opening-toolbar-group" aria-label="Split opening">
        <button
          type="button"
          className="tb-btn"
          disabled={!state.canSplitVertical}
          title="Split opening vertically"
          onClick={() => onCommand({ kind: "split-vertical" })}
        >
          Split V
        </button>
        <button
          type="button"
          className="tb-btn"
          disabled={!state.canSplitHorizontal}
          title="Split opening horizontally"
          onClick={() => onCommand({ kind: "split-horizontal" })}
        >
          Split H
        </button>
      </div>
      <div className="elevation-opening-toolbar-group" aria-label="Opening content">
        {state.allowedContentTypes.map((contentType) => (
          <ContentTypeButton
            key={contentType}
            contentType={contentType}
            active={state.activeContentType === contentType}
            onClick={() =>
              onCommand({ kind: "set-content", contentType })
            }
          />
        ))}
      </div>
    </div>
  );
}

function ContentTypeButton({
  contentType,
  active,
  onClick,
}: {
  contentType: OpeningContentType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`tb-btn ${active ? "tb-accent" : ""}`}
      title={`Set opening to ${ELEVATION_CONTENT_SHORT_LABELS[contentType]}`}
      onClick={onClick}
    >
      {ELEVATION_CONTENT_SHORT_LABELS[contentType]}
    </button>
  );
}
