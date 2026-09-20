import { useState } from "react";

type Props = {
  pixelScale: number | null | undefined;
  busy: boolean;
  onApplyRefLength: (refLengthM: number, refLengthPx: number) => void;
  onApplyPixelScale: (pixelScale: number, rescaleCoords: boolean) => void;
};

/** Primary calibrate = known length → scale; pixel_scale is advanced. */
export function FloorplanExtractCalibrate(props: Props) {
  const [refM, setRefM] = useState("3.2");
  const [refPx, setRefPx] = useState("640");
  const [scaleInput, setScaleInput] = useState(String(props.pixelScale ?? 0.01));
  const [rescale, setRescale] = useState(true);

  const applyRef = () => {
    const m = Number(refM);
    const px = Number(refPx);
    if (!(m > 0) || !(px > 0)) return;
    props.onApplyRefLength(m, px);
    setScaleInput(String(m / px));
  };

  return (
    <section data-testid="lr-floorplan-calibrate" aria-label="Scale calibration">
      <strong>Calibrate scale</strong>
      <p style={{ margin: "4px 0", fontSize: 12, color: "#555" }}>
        Measure a known wall. Apply stays blocked until scale is calibrated.
      </p>
      <label>
        Real length (m)
        <input data-testid="lr-floorplan-ref-m" value={refM} disabled={props.busy}
          onChange={(e) => setRefM(e.target.value)} />
      </label>
      <label>
        Same length (px / drawing units)
        <input data-testid="lr-floorplan-ref-px" value={refPx} disabled={props.busy}
          onChange={(e) => setRefPx(e.target.value)} />
      </label>
      <button type="button" data-testid="lr-floorplan-apply-ref" disabled={props.busy} onClick={applyRef}>
        Apply measured length
      </button>

      <details style={{ marginTop: 8 }}>
        <summary>Advanced: pixel_scale</summary>
        <label>
          pixel_scale (m/unit)
          <input data-testid="lr-floorplan-scale-input" value={scaleInput} disabled={props.busy}
            onChange={(e) => setScaleInput(e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={rescale} disabled={props.busy}
            onChange={(e) => setRescale(e.target.checked)} />
          Rescale coordinates
        </label>
        <button type="button" disabled={props.busy} onClick={() => {
          const next = Number(scaleInput);
          if (!(next > 0)) return;
          props.onApplyPixelScale(next, rescale);
        }}>
          Apply pixel_scale
        </button>
      </details>
    </section>
  );
}
