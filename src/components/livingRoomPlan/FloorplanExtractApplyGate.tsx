import type { ApplyImpactFinding } from "../../domain/floorplanExtract";
import type { LiveSchemaStatus } from "../../domain/floorplanExtract";

type Props = {
  impact: ApplyImpactFinding[];
  liveSchema: LiveSchemaStatus;
  replaceAck: boolean;
  schemaFallbackAck: boolean;
  onReplaceAck: (v: boolean) => void;
  onSchemaFallbackAck: (v: boolean) => void;
};

export function FloorplanExtractApplyGate(props: Props) {
  const needsReplaceAck = props.impact.length > 0;
  const schemaFallback = props.liveSchema.state === "structural-fallback" ? props.liveSchema : null;

  return (
    <section data-testid="lr-floorplan-apply-gate" aria-label="Apply confirmation">
      <p style={{ fontWeight: 600, marginBottom: 4 }}>
        Apply replaces Studio shell topology (walls, rooms, openings, surfaces, objects).
      </p>
      {needsReplaceAck ? (
        <>
          <p data-testid="lr-floorplan-apply-impact" style={{ color: "#8a5a00", margin: "4px 0" }}>
            Intervening Studio work detected:
          </p>
          <ul>
            {props.impact.map((f) => (
              <li key={f.code}>{f.message}</li>
            ))}
          </ul>
          <label>
            <input
              type="checkbox"
              data-testid="lr-floorplan-replace-ack"
              checked={props.replaceAck}
              onChange={(e) => props.onReplaceAck(e.target.checked)}
            />
            I understand Apply will discard the listed Studio changes
          </label>
        </>
      ) : (
        <p style={{ color: "#555", fontSize: 12 }}>No intervening Studio edits detected beyond extract shell.</p>
      )}

      {schemaFallback ? (
        <div data-testid="lr-floorplan-schema-fallback" style={{ marginTop: 8 }}>
          <p style={{ color: "#b00020" }}>
            Live schema check unavailable: {schemaFallback.message}
          </p>
          <label>
            <input
              type="checkbox"
              data-testid="lr-floorplan-schema-fallback-ack"
              checked={props.schemaFallbackAck}
              onChange={(e) => props.onSchemaFallbackAck(e.target.checked)}
            />
            Apply with structural validation only (sidecar schema not verified)
          </label>
        </div>
      ) : props.liveSchema.state === "live-ok" ? (
        <p data-testid="lr-floorplan-schema-live-ok" style={{ color: "#2e7d32", fontSize: 12 }}>
          Live GET /schema/v1 validation passed.
        </p>
      ) : null}
    </section>
  );
}

export function canPassApplyGate(input: {
  impact: ApplyImpactFinding[];
  liveSchema: LiveSchemaStatus;
  replaceAck: boolean;
  schemaFallbackAck: boolean;
}): boolean {
  if (input.impact.length > 0 && !input.replaceAck) return false;
  if (input.liveSchema.state === "structural-fallback" && !input.schemaFallbackAck) return false;
  if (input.liveSchema.state === "live-rejected") return false;
  return true;
}
