type Props = {
  message: string;
  refreshing: boolean;
  reapplying: boolean;
  onRefreshSourcePreview: () => void;
  onReapplyExtract: () => void;
  reapplyDisabled?: boolean;
  reapplyTitle?: string;
};

/**
 * Honest stale UI: Refresh reloads the saved-extract GLB (does not sync Studio edits).
 * Re-apply resets editable shell from the saved extract (destructive — also clears objects/surfaces).
 */
export function FloorplanPreviewStaleBar({
  message,
  refreshing,
  reapplying,
  onRefreshSourcePreview,
  onReapplyExtract,
  reapplyDisabled,
  reapplyTitle,
}: Props) {
  return (
    <div
      className="lr-floorplan-preview-stale"
      data-testid="lr-floorplan-preview-stale"
      role="status"
    >
      <span className="lr-floorplan-preview-stale-badge">{message}</span>
      <button
        type="button"
        data-testid="lr-floorplan-refresh-source-preview"
        disabled={refreshing || reapplying}
        title="Re-fetch the GLB from the saved extract. Does not update Studio walls."
        onClick={onRefreshSourcePreview}
      >
        {refreshing ? "Refreshing…" : "Refresh source preview"}
      </button>
      <button
        type="button"
        data-testid="lr-floorplan-reapply-extract"
        disabled={reapplying || refreshing || reapplyDisabled}
        title={
          reapplyTitle
          ?? "Replace Studio shell from the saved extract; clears objects and surfaces."
        }
        onClick={onReapplyExtract}
      >
        {reapplying ? "Re-applying…" : "Re-apply extract"}
      </button>
    </div>
  );
}
