import { useEffect, useMemo, useState } from "react";
import {
  extractDwgSuggestCenterlines,
  resolveDwgSuggestLayerNames,
  visibleDwgLayerNames,
  type DwgSuggestHighlightStroke,
  type DwgSuggestPlanRegion,
  type LivingRoomPlanUnderlay,
} from "../domain/livingRoom";

export type DwgSuggestSelectionUi = {
  visibleLayers: string[];
  selectedLayers: string[];
  region: DwgSuggestPlanRegion | null;
  pickingRegion: boolean;
  strokes: DwgSuggestHighlightStroke[];
  skippedCurves: number;
  segmentCount: number;
  onToggleLayer: (name: string) => void;
  onPickRegion: () => void;
  onClearRegion: () => void;
  onRegion: (region: DwgSuggestPlanRegion | null) => void;
};

export function useDwgSuggestSelection(underlay: LivingRoomPlanUnderlay | null): DwgSuggestSelectionUi {
  const [requested, setRequested] = useState<string[] | null>(null);
  const [region, setRegion] = useState<DwgSuggestPlanRegion | null>(null);
  const [pickingRegion, setPickingRegion] = useState(false);
  const sourceKey = `${underlay?.fileName ?? ""}:${underlay?.dwg ? "dwg" : ""}`;

  useEffect(() => {
    setRequested(null);
    setRegion(null);
    setPickingRegion(false);
  }, [sourceKey]);

  const visibleLayers = visibleDwgLayerNames(underlay);
  const selectedLayers = resolveDwgSuggestLayerNames(underlay, requested);
  const extract = useMemo(
    () => extractDwgSuggestCenterlines(underlay, requested, region),
    [underlay, requested, region],
  );
  const strokes = useMemo(
    () => extract.segments.map((segment) => ({ layer: segment.layer, points: [segment.a, segment.b] })),
    [extract],
  );

  return {
    visibleLayers,
    selectedLayers,
    region,
    pickingRegion,
    strokes,
    skippedCurves: extract.skippedCurves,
    segmentCount: extract.segments.length,
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
  };
}
