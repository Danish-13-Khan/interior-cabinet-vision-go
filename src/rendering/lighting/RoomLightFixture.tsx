import { isLightFixtureKind } from "../../domain/livingRoom/lightFixtureTypes";
import { CobFixture } from "./fixtures/CobFixture";
import { CoveFixture } from "./fixtures/CoveFixture";
import { PanelFixture } from "./fixtures/PanelFixture";
import { PendantFixture } from "./fixtures/PendantFixture";
import { StripFixture } from "./fixtures/StripFixture";
import { TrackFixture } from "./fixtures/TrackFixture";
import type { FixtureViewProps } from "./fixtures/fixtureView";

export { roomLightRotation } from "./fixtures/fixtureMeasures";

/** Dispatcher. Each kind's body emits along local −Z; the group applies rotation. */
export function RoomLightFixture(props: FixtureViewProps) {
  const kind = props.light.parameters.fixtureKind;
  if (!isLightFixtureKind(kind)) return null;
  switch (kind) {
    case "cove":
      return <CoveFixture {...props} />;
    case "rope":
    case "profile":
    case "under-cabinet":
      return <StripFixture {...props} />;
    case "panel":
      return <PanelFixture {...props} />;
    case "cob":
    case "ceiling-downlight":
      return <CobFixture {...props} />;
    case "track":
      return <TrackFixture {...props} />;
    case "pendant":
      return <PendantFixture {...props} />;
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}
