import { Canvas } from "@react-three/fiber";
import {
  FLOORPLAN_PREVIEW_OWNERSHIP_NOTE,
  type ExtractionResult,
} from "../../domain/floorplanExtract";
import { useFloorplanGlbPreview } from "../../hooks/useFloorplanGlbPreview";
import { FloorplanPreviewStage } from "./FloorplanPreviewStage";
import { GlbLoadErrorBoundary } from "../livingRoomScene/GlbLoadErrorBoundary";

export type FloorplanPreviewViewportProps = {
  draft: ExtractionResult;
  draftKey: string;
};

/**
 * Review-dialog chrome host for FloorplanPreviewMesh (not LivingRoomModelView).
 * Keep the Canvas mounted once a URL exists — remounting inside a scrollable
 * review panel commonly triggers WebGL context loss.
 */
export function FloorplanPreviewViewport({ draft, draftKey }: FloorplanPreviewViewportProps) {
  const preview = useFloorplanGlbPreview(draft, true, draftKey);
  const url =
    preview.status === "ready" || preview.status === "loading" || preview.status === "error"
      ? preview.objectUrl
      : undefined;

  return (
    <div className="lr-floorplan-preview-viewport" data-testid="lr-floorplan-preview-viewport">
      <p className="lr-floorplan-preview-label">{FLOORPLAN_PREVIEW_OWNERSHIP_NOTE}</p>
      {preview.status === "loading" && !url ? <p>Building 3D preview…</p> : null}
      {preview.status === "loading" && url ? <p>Refreshing 3D preview…</p> : null}
      {preview.status === "error" ? (
        <p>
          {preview.message}{" "}
          <button type="button" onClick={preview.retry}>Retry</button>
        </p>
      ) : null}
      {url ? (
        <div className="lr-floorplan-preview-canvas-host">
          <GlbLoadErrorBoundary key={url} fallback={<p>Could not display GLB preview. Try Hide 3D, then View 3D again.</p>}>
            <Canvas
              frameloop="demand"
              dpr={[1, 1.5]}
              camera={{ position: [6, 4, 6], fov: 45, near: 0.05, far: 500 }}
              gl={{ antialias: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
              style={{ width: "100%", height: "100%", display: "block" }}
              onCreated={({ gl }) => {
                const canvas = gl.domElement;
                const onLost = (event: Event) => {
                  event.preventDefault();
                };
                canvas.addEventListener("webglcontextlost", onLost, false);
              }}
            >
              <FloorplanPreviewStage url={url} />
            </Canvas>
          </GlbLoadErrorBoundary>
        </div>
      ) : null}
    </div>
  );
}
