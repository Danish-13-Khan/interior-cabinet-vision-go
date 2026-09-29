import { lazy, Suspense } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import type { FloorplanExtractDraft } from "../../hooks/useFloorplanExtractFlow";

const FloorplanExtractReview = lazy(async () => {
  const mod = await import("./FloorplanExtractReview");
  return { default: mod.FloorplanExtractReview };
});

type FloorplanExtractSlotProps = {
  draft: FloorplanExtractDraft | null;
  project: InteriorProject;
  onClose: () => void;
  onApply: (next: InteriorProject, status: string) => void;
};

export function FloorplanExtractSlot(props: FloorplanExtractSlotProps) {
  if (!props.draft) return null;
  return (
    <Suspense fallback={null}>
      <FloorplanExtractReview
        draft={props.draft.draft}
        draftKey={props.draft.draftKey}
        initialLiveSchema={props.draft.liveSchema}
        project={props.project}
        onClose={props.onClose}
        onApply={(next, _appliedDraft, status) => props.onApply(next, status)}
      />
    </Suspense>
  );
}
