import { useEffect, useMemo, useState } from "react";
import {
  dwgSuggestHighlightStrokes,
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
  const strokes = useMemo(
    () => dwgSuggestHighlightStrokes(underlay, requested, region),
    [underlay, requested, region],
  );

  return {
    visibleLayers,
    selectedLayers,
    region,
    pickingRegion,
    strokes,
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
