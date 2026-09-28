import { useEffect, useRef } from "react";
import { onSelectionFrameRequest } from "../utils/selectionFrameRequest";

/** Runs `frame` whenever another panel (e.g. Review) asks the active view to frame the selection. */
export function useSelectionFrameRequest(frame: () => void) {
  const latest = useRef(frame);
  latest.current = frame;
  useEffect(() => onSelectionFrameRequest(() => latest.current()), []);
}
