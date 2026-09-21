import { useEffect, useMemo, useState } from "react";
import {
  acceptedDwgSuggestCandidates,
  applyDwgSuggestOverlap,
  buildDwgSuggestDraft,
  dwgSuggestCandidateSelectable,
  extractDwgSuggestCenterlines,
  resolveDwgSuggestLayerNames,
  setDwgSuggestCandidateAccepted,
  setDwgSuggestDraftAccepted,
  visibleDwgLayerNames,
  type DwgSuggestDraft,
  type DwgSuggestHighlightStroke,
  type DwgSuggestPlanRegion,
  type DwgSuggestWallSeg,
  type LivingRoomPlanUnderlay,
} from "../domain/livingRoom";
import { clampWallHeightMm, clampWallThicknessMm } from "../domain/interiorProject";

export type DwgSuggestSelectionUi = {
  visibleLayers: string[];
  selectedLayers: string[];
  region: DwgSuggestPlanRegion | null;
  pickingRegion: boolean;
  strokes: DwgSuggestHighlightStroke[];
  skippedCurves: number;
  segmentCount: number;
  draft: DwgSuggestDraft | null;
  thicknessMm: number;
  heightMm: number;
  acceptedCount: number;
  onToggleLayer: (name: string) => void;
  onPickRegion: () => void;
  onClearRegion: () => void;
  onRegion: (region: DwgSuggestPlanRegion | null) => void;
  onPreview: () => void;
  onClearDraft: () => void;
  onToggleCandidate: (id: string) => void;
  onSetAccepted: (accepted: boolean) => void;
  onThicknessMm: (value: number) => void;
  onHeightMm: (value: number) => void;
};

export function useDwgSuggestSelection(
  underlay: LivingRoomPlanUnderlay | null,
  defaults?: { thicknessMm?: number; heightMm?: number; walls?: readonly DwgSuggestWallSeg[] },
): DwgSuggestSelectionUi {
  const [requested, setRequested] = useState<string[] | null>(null);
  const [region, setRegion] = useState<DwgSuggestPlanRegion | null>(null);
  const [pickingRegion, setPickingRegion] = useState(false);
  const [draft, setDraft] = useState<DwgSuggestDraft | null>(null);
  const [thicknessMm, setThicknessMm] = useState(clampWallThicknessMm(defaults?.thicknessMm ?? 120));
  const [heightMm, setHeightMm] = useState(clampWallHeightMm(defaults?.heightMm ?? 2800));
  const sourceKey = `${underlay?.fileName ?? ""}:${underlay?.dwg ? "dwg" : ""}`;
  const walls = defaults?.walls ?? [];
  const wallsKey = walls.map((wall) => `${wall.start.x},${wall.start.z}:${wall.end.x},${wall.end.z}`).join("|");

  useEffect(() => {
    setRequested(null);
    setRegion(null);
    setPickingRegion(false);
    setDraft(null);
  }, [sourceKey]);

  useEffect(() => {
    setDraft((current) => current ? applyDwgSuggestOverlap(current, walls) : current);
  }, [wallsKey]);

  const visibleLayers = visibleDwgLayerNames(underlay);
  const selectedLayers = resolveDwgSuggestLayerNames(underlay, requested);
  const extract = useMemo(
    () => extractDwgSuggestCenterlines(underlay, requested, region),
    [underlay, requested, region],
  );
  const strokes = useMemo((): DwgSuggestHighlightStroke[] => {
    if (draft) {
      return draft.candidates.map((candidate) => ({
        layer: candidate.layer,
        points: [candidate.a, candidate.b],
        candidateId: candidate.id,
        accepted: candidate.accepted,
        closed: candidate.closed,
        overlap: candidate.overlap,
      }));
    }
    return extract.segments.map((segment) => ({ layer: segment.layer, points: [segment.a, segment.b] }));
  }, [draft, extract]);

  return {
    visibleLayers,
    selectedLayers,
    region,
    pickingRegion,
    strokes,
    skippedCurves: extract.skippedCurves,
    segmentCount: extract.segments.length,
    draft,
    thicknessMm,
    heightMm,
    acceptedCount: acceptedDwgSuggestCandidates(draft).length,
    onToggleLayer: (name) => {
      if (!visibleLayers.includes(name)) return;
      const next = new Set(selectedLayers);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      setRequested([...next]);
    },
    onPickRegion: () => setPickingRegion(true),
    onClearRegion: () => {
      setRegion(null);
      setPickingRegion(false);
    },
    onRegion: (value) => {
      setRegion(value);
      setPickingRegion(false);
    },
    onPreview: () => {
      setDraft(applyDwgSuggestOverlap(
        buildDwgSuggestDraft(extract.segments, { thicknessMm, heightMm }),
        walls,
      ));
    },
    onClearDraft: () => setDraft(null),
    onToggleCandidate: (id) => {
      setDraft((current) => {
        const item = current?.candidates.find((candidate) => candidate.id === id);
        if (!current || !item || !dwgSuggestCandidateSelectable(item)) return current;
        return setDwgSuggestCandidateAccepted(current, id, !item.accepted);
      });
    },
    onSetAccepted: (accepted) => {
      setDraft((current) => current ? setDwgSuggestDraftAccepted(current, accepted) : current);
    },
    onThicknessMm: (value) => {
      const next = clampWallThicknessMm(value);
      setThicknessMm(next);
      setDraft((current) => current ? { ...current, thicknessMm: next } : current);
    },
    onHeightMm: (value) => {
      const next = clampWallHeightMm(value);
      setHeightMm(next);
      setDraft((current) => current ? { ...current, heightMm: next } : current);
    },
  };
}
