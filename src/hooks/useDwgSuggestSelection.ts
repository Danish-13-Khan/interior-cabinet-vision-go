import { useEffect, useMemo, useState } from "react";
import {
  buildDwgSuggestDraft,
  extractDwgSuggestCenterlines,
  resolveDwgSuggestLayerNames,
  setDwgSuggestCandidateAccepted,
  setDwgSuggestDraftAccepted,
  visibleDwgLayerNames,
  type DwgSuggestDraft,
  type DwgSuggestHighlightStroke,
  type DwgSuggestPlanRegion,
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
  defaults?: { thicknessMm?: number; heightMm?: number },
): DwgSuggestSelectionUi {
  const [requested, setRequested] = useState<string[] | null>(null);
  const [region, setRegion] = useState<DwgSuggestPlanRegion | null>(null);
  const [pickingRegion, setPickingRegion] = useState(false);
  const [draft, setDraft] = useState<DwgSuggestDraft | null>(null);
  const [thicknessMm, setThicknessMm] = useState(clampWallThicknessMm(defaults?.thicknessMm ?? 120));
  const [heightMm, setHeightMm] = useState(clampWallHeightMm(defaults?.heightMm ?? 2800));
  const sourceKey = `${underlay?.fileName ?? ""}:${underlay?.dwg ? "dwg" : ""}`;

  useEffect(() => {
    setRequested(null);
    setRegion(null);
    setPickingRegion(false);
    setDraft(null);
  }, [sourceKey]);

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
    acceptedCount: draft?.candidates.filter((item) => item.accepted).length ?? 0,
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
      setDraft(buildDwgSuggestDraft(extract.segments, { thicknessMm, heightMm }));
    },
    onClearDraft: () => setDraft(null),
    onToggleCandidate: (id) => {
      setDraft((current) => {
        const item = current?.candidates.find((candidate) => candidate.id === id);
        return current && item
          ? setDwgSuggestCandidateAccepted(current, id, !item.accepted)
          : current;
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
