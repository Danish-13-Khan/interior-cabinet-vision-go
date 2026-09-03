import { useCallback, useState } from "react";
import {
  persistInteriorsUiMode,
  readInteriorsUiMode,
  type InteriorsUiMode,
} from "../domain/desktopUx";

export function useInteriorsUiMode() {
  const [mode, setModeState] = useState<InteriorsUiMode>(readInteriorsUiMode);
  const setMode = useCallback((next: InteriorsUiMode) => {
    setModeState(next);
    persistInteriorsUiMode(next);
  }, []);
  return { mode, setMode };
}
