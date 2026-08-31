type ModelViewDollhousePanelProps = {
  cameraHeightMm: number;
  fieldOfViewDegrees: number;
  showHeight?: boolean;
  onCameraHeightMm: (value: number) => void;
  onFieldOfViewDegrees: (value: number) => void;
};

export function ModelViewDollhousePanel({
  cameraHeightMm,
  fieldOfViewDegrees,
  showHeight = true,
  onCameraHeightMm,
  onFieldOfViewDegrees,
}: ModelViewDollhousePanelProps) {
  return (
    <div className="lr-camera-panel" aria-label={showHeight ? "Dollhouse camera controls" : "Perspective camera controls"}>
      <span>VIEW</span>
      {showHeight ? (
        <label>
          Height
          <input
            aria-label="Camera height"
            type="range"
            min="1800"
            max="6500"
            step="100"
            value={cameraHeightMm}
            onChange={(event) => onCameraHeightMm(Number(event.target.value))}
          />
          <b>{(cameraHeightMm / 1000).toFixed(1)}m</b>
        </label>
      ) : null}
      <label>
        FOV
        <input
          aria-label="Camera field of view"
          type="range"
          min="28"
          max="70"
          step="1"
          value={fieldOfViewDegrees}
          onChange={(event) => onFieldOfViewDegrees(Number(event.target.value))}
        />
        <b>{fieldOfViewDegrees}°</b>
      </label>
    </div>
  );
}
