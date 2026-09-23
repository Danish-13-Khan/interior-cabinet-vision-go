import { useEffect, useMemo, useState } from "react";
import { cabinetProjectFromInteriorProject, type InteriorProject } from "../domain/interiorProject";
import { partPickForCutlistKey, retainedPartKey } from "../domain/studio/partPick";

export function useStudioPartSelection(input: {
  project: InteriorProject | null;
  selectedIds: readonly string[];
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onActiveRoom: (roomId: string) => void;
}) {
  const [selectedCutlistKey, setSelectedCutlistKey] = useState<string | null>(null);
  const cabinets = useMemo(
    () => (input.project ? cabinetProjectFromInteriorProject(input.project).project.cabinets : []),
    [input.project],
  );

  useEffect(() => {
    setSelectedCutlistKey((current) => retainedPartKey({
      cutlistKey: current,
      cabinets,
      activeRoomId: input.project?.activeRoomId ?? null,
      selectedObjectIds: input.selectedIds,
      objectRoomId: (objectId) => input.project?.objects.find((item) => item.id === objectId)?.roomId ?? null,
    }));
  }, [cabinets, input.project, input.selectedIds]);

  function selectCutlistLine(key: string) {
    const pick = partPickForCutlistKey(cabinets, key);
    if (!pick) {
      setSelectedCutlistKey(null);
      return;
    }
    const roomId = input.project?.objects.find((item) => item.id === pick.objectId)?.roomId;
    if (roomId && roomId !== input.project?.activeRoomId) input.onActiveRoom(roomId);
    input.onSelect(pick.objectId);
    setSelectedCutlistKey(pick.cutlistKey);
  }

  return { selectedCutlistKey, setSelectedCutlistKey, selectCutlistLine, cabinets };
}
