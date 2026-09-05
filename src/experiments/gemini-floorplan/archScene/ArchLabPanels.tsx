import type { ArchitecturalScene } from "./archSceneTypes";
import { FixtureReviewPanel } from "./FixtureReviewPanel";
import { OpeningEditorPanel } from "./OpeningEditorPanel";
import { ReconstructionWorkbench } from "./ReconstructionWorkbench";
import { TopologyPanel } from "./TopologyPanel";
import { TopologyRepairPanel } from "./TopologyRepairPanel";

type Actions = {
  select: (id: string) => void;
  joinEnds: (a: string, b: string) => void;
  splitSelected: () => void;
  moveOpening: (id: string, t: number) => void;
  resizeOpening: (id: string, w: number) => void;
  rehostOpening: (id: string, wallId: string) => void;
  setSwing: (id: string, swing: "left" | "right" | "unknown") => void;
  inferSwings: () => void;
  setFixtureReview: (id: string, review: "accepted" | "rejected" | "pending") => void;
  setCatalog: (id: string, catalogId: string) => void;
  setLighting: (p: "studio" | "warm" | "cool") => void;
  setSkirting: (mm: number) => void;
  toggleEntityAccept: (id: string) => void;
};

type Props = {
  scene: ArchitecturalScene | null;
  selectedId: string | null;
  acceptedIds: string[];
  actions: Actions;
};

/** Phases 7–14 review panels (keeps lab page thin). */
export function ArchLabPanels({ scene, selectedId, acceptedIds, actions }: Props) {
  return (
    <>
      <div className="gfl-grid gfl-grid--geom">
        <TopologyPanel scene={scene} />
        <TopologyRepairPanel
          scene={scene}
          selectedId={selectedId}
          onSelect={actions.select}
          onJoin={actions.joinEnds}
          onSplit={actions.splitSelected}
        />
        <OpeningEditorPanel
          scene={scene}
          selectedId={selectedId}
          onSelect={actions.select}
          onMove={actions.moveOpening}
          onResize={actions.resizeOpening}
          onRehost={actions.rehostOpening}
          onSwing={actions.setSwing}
          onInferSwings={actions.inferSwings}
        />
        <FixtureReviewPanel
          scene={scene}
          onReview={actions.setFixtureReview}
          onCatalog={actions.setCatalog}
        />
        <ReconstructionWorkbench
          scene={scene}
          acceptedIds={acceptedIds}
          selectedId={selectedId}
          onSelect={actions.select}
          onToggleAccept={actions.toggleEntityAccept}
          onLighting={actions.setLighting}
          onSkirting={actions.setSkirting}
        />
      </div>
    </>
  );
}
