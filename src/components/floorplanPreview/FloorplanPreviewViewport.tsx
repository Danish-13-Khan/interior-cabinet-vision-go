import { Canvas } from "@react-three/fiber";
import type { ExtractionResult } from "../../domain/floorplanExtract";
import { useFloorplanGlbPreview } from "../../hooks/useFloorplanGlbPreview";
import { FloorplanPreviewStage } from "./FloorplanPreviewStage";
import { GlbLoadErrorBoundary } from "../livingRoomScene/GlbLoadErrorBoundary";

export type FloorplanPreviewViewportProps = {
  draft: ExtractionResult;
  draftKey: string;
};

/** Review-dialog chrome host for FloorplanPreviewMesh (not LivingRoomModelView). */
export function FloorplanPreviewViewport({ draft, draftKey }: FloorplanPreviewViewportProps) {
  const preview = useFloorplanGlbPreview(draft, true, draftKey);

  return (
    <div className="lr-floorplan-preview-viewport" data-testid="lr-floorplan-preview-viewport">
      <p className="lr-floorplan-preview-label">Preview mesh from floorplan tool (not editable shell)</p>
      {preview.status === "loading" ? <p>Building 3D preview…</p> : null}
      {preview.status === "error" ? (
        <p>
          {preview.message}{" "}
          <button type="button" onClick={preview.retry}>Retry</button>
        </p>
      ) : null}
      {preview.status === "ready" ? (
        <div className="lr-floorplan-preview-canvas-host">
          <GlbLoadErrorBoundary fallback={<p>Could not display GLB preview.</p>}>
            <Canvas
              frameloop="demand"
              dpr={[1, 1.5]}
              camera={{ position: [6, 4, 6], fov: 45, near: 0.05, far: 500 }}
              gl={{ antialias: true }}
            >
              <FloorplanPreviewStage url={preview.objectUrl} />
            </Canvas>
          </GlbLoadErrorBoundary>
        </div>
      ) : null}
    </div>
  );
}
