import { useEffect, useRef } from "react";
import type { ProjectToolsProps } from "./InteriorProjectTools";
import { InteriorProjectToolsDialog } from "./InteriorProjectTools";

/** Mounts the project tools dialog without its own trigger; the job menu opens it via `openSignal`. */
export function InteriorProjectToolsLauncher({ openSignal, ...props }: ProjectToolsProps & { openSignal: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (openSignal > 0 && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [openSignal]);
  return <InteriorProjectToolsDialog {...props} dialogRef={dialog} />;
}
