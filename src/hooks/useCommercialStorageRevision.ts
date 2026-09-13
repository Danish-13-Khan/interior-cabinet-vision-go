import { useEffect, useState } from "react";
const EVENT = "cabinet-commercial-storage-changed";
export function notifyCommercialStorageChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}
export function useCommercialStorageRevision() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const update = () => setRevision(r => r + 1);
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener(EVENT, update); window.removeEventListener("storage", update); };
  }, []);
  return revision;
}
