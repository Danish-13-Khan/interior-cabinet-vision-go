import type { ResizeAnchor } from "../../domain/interiorProject";

/** Which edge a typed size keeps: three buttons, the middle one is today's centre behaviour. */
export function ResizeAnchorSegment(props: {
  label: string;
  value: ResizeAnchor;
  minLabel: string;
  maxLabel: string;
  testId?: string;
  onChange: (anchor: ResizeAnchor) => void;
}) {
  const options: Array<[ResizeAnchor, string]> = [["min", props.minLabel], ["centre", "Centre"], ["max", props.maxLabel]];
  return (
    <div className="lr-resize-anchor" role="group" aria-label={props.label} data-testid={props.testId}>
      <span>Keeps</span>
      {options.map(([anchor, text]) => (
        <button type="button" key={anchor} className={props.value === anchor ? "is-active" : ""}
          aria-pressed={props.value === anchor} onClick={() => props.onChange(anchor)}>{text}</button>
      ))}
    </div>
  );
}
