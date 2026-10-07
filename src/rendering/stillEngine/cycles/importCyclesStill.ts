import type { InteriorProject, RenderComposition } from "../../../domain/interiorProject";
import {
  buildStillJob,
  CYCLES_STILL_ENGINE,
  CYCLES_STILL_ENHANCEMENTS,
  mergeStillValidations,
  openStillReview,
  STILL_JOB_TOLERANCES,
  validateStillJobAgainstProject,
  type StillJob,
  type StillJobGateResult,
  type StillJobValidation,
  type StillReviewSession,
} from "../../../domain/livingRoom";
import type { RenderCaptureHandle } from "../../../components/livingRoomScene/RenderCaptureBridge";
import { stillDiffOverlayDataUrl } from "../../export/stillDiffOverlay";

/** What `render-sources/blender/render_still.py` writes next to the still. */
export type CyclesProvenanceFile = {
  engine: { id: string; version: string };
  jobId: string;
  projectId: string;
  projectContentHash: string;
  cameraId: string;
  seed: number;
  materialIds: string[];
  device: string;
  blender: string;
  elapsedSeconds: number;
  resolution: [number, number];
  deterministicRerun: { mad: number; limit: number; pass: boolean } | null;
  warnings?: string[];
};

export function parseCyclesProvenance(text: string): CyclesProvenanceFile {
  const parsed = JSON.parse(text) as Partial<CyclesProvenanceFile>;
  if (!parsed || typeof parsed !== "object" || !parsed.engine || typeof parsed.jobId !== "string") {
    throw new Error("Not a Cycles provenance file.");
  }
  if (parsed.engine.id !== CYCLES_STILL_ENGINE.id) {
    throw new Error(`Provenance engine ${parsed.engine.id} is not ${CYCLES_STILL_ENGINE.id}.`);
  }
  return parsed as CyclesProvenanceFile;
}

function gate(id: StillJobGateResult["id"], pass: boolean, detail: string, measured?: number, limit?: number): StillJobGateResult {
  return { id, pass, detail, measured, limit };
}

function sameIdSet(a: readonly string[], b: readonly string[]) {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...left].every((id) => right.has(id));
}

/** Gates the Python provenance must satisfy against the project as it is now. */
export function cyclesProvenanceGates(provenance: CyclesProvenanceFile, job: StillJob): StillJobGateResult[] {
  const rerun = provenance.deterministicRerun;
  return [
    gate(
      "project_hash",
      provenance.projectContentHash === job.projectContentHash,
      provenance.projectContentHash === job.projectContentHash
        ? "rendered from the current project"
        : "project changed since the bundle was exported; export and render again",
    ),
    gate("camera_id", provenance.cameraId === job.cameraId, `camera ${provenance.cameraId}`),
    gate(
      "material_ids",
      sameIdSet(provenance.materialIds, job.materials.map((slot) => slot.materialId)),
      `${provenance.materialIds.length} material ids echoed by the render`,
    ),
    rerun
      ? gate("deterministic_rerun", rerun.pass, `Cycles rerun MAD ${rerun.mad.toFixed(3)} on ${provenance.device} (limit ${rerun.limit.toFixed(2)})`, rerun.mad, rerun.limit)
      : gate("deterministic_rerun", false, "no rerun recorded; render with --rerun to prove determinism"),
  ];
}

export type CyclesImportResult = {
  still: string;
  /** Null when no live capture was available (Present renders without the studio canvas). */
  plateDataUrl: string | null;
  diffDataUrl: string | null;
  validation: StillJobValidation;
  session: StillReviewSession;
  provenance: CyclesProvenanceFile;
};

/**
 * Bring a Cycles still back through the same review step as the hero still:
 * rebuild the job for the provenance's camera, gate it, capture the WebGL plate
 * for the overlay, and open the review. No hero grade is applied.
 */
export async function importCyclesStill(args: {
  project: InteriorProject;
  provenance: CyclesProvenanceFile;
  stillDataUrl: string;
  capture: RenderCaptureHandle | null;
  widthPx: number;
  heightPx: number;
  composition: RenderComposition;
}): Promise<CyclesImportResult> {
  const { project, provenance } = args;
  const job = buildStillJob({
    project,
    cameraId: provenance.cameraId,
    jobId: provenance.jobId,
    seed: provenance.seed,
    qualityPresetId: "presentation",
    engine: { id: CYCLES_STILL_ENGINE.id, version: provenance.engine.version },
    allowedEnhancements: [...CYCLES_STILL_ENHANCEMENTS],
    attachments: { heroPngPath: `${provenance.jobId}-webgl-plate.png` },
  });
  const plateDataUrl = args.capture
    ? await args.capture.capturePng({
      cameraId: provenance.cameraId,
      widthPx: args.widthPx,
      heightPx: args.heightPx,
      transparentBackground: false,
      composition: args.composition,
    })
    : null;
  const gates = cyclesProvenanceGates(provenance, job);
  const validation = mergeStillValidations(
    validateStillJobAgainstProject(job, project),
    { ok: gates.every((item) => item.pass), gates, tolerances: STILL_JOB_TOLERANCES },
  );
  const diffDataUrl = plateDataUrl ? await stillDiffOverlayDataUrl(plateDataUrl, args.stillDataUrl) : null;
  return {
    still: args.stillDataUrl,
    plateDataUrl,
    diffDataUrl,
    validation,
    session: openStillReview(job, job.attachments.heroPngPath ?? null, `${provenance.jobId}-cycles.png`),
    provenance,
  };
}
