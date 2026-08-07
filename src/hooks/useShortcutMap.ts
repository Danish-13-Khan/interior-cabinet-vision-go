import { useCallback, useEffect, useState } from "react";
import {
  clampShortcutMap,
  persistShortcutMap,
  readShortcutMap,
  type ShortcutActionId,
  type ShortcutBinding,
  type ShortcutMap,
} from "../domain/desktopUx";

export function useShortcutMap() {
  const [shortcutMap, setShortcutMapState] = useState<ShortcutMap>(() =>
    readShortcutMap(),
  );

  useEffect(() => {
    persistShortcutMap(shortcutMap);
  }, [shortcutMap]);

  const setBinding = useCallback(
    (actionId: ShortcutActionId, binding: ShortcutBinding) => {
      setShortcutMapState((current) =>
        clampShortcutMap({
          ...current,
          [actionId]: binding,
        }),
      );
    },
    [],
  );

  const resetShortcuts = useCallback(() => {
    setShortcutMapState(clampShortcutMap(null));
  }, []);

  return {
    shortcutMap,
    setBinding,
    resetShortcuts,
  };
}
