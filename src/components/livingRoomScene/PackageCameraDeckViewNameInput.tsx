import { useEffect, useState } from "react";

type PackageCameraDeckViewNameInputProps = {
  cameraId: string;
  cameraName: string;
  viewName: string;
  onCommitViewName: (cameraId: string, viewName: string) => void;
};

export function PackageCameraDeckViewNameInput({
  cameraId,
  cameraName,
  viewName,
  onCommitViewName,
}: PackageCameraDeckViewNameInputProps) {
  const [draft, setDraft] = useState(viewName);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(viewName);
  }, [viewName, editing]);

  return (
    <input
      aria-label={`Package view name for ${cameraName}`}
      value={draft}
      onChange={(event) => setDraft(event.target.value.slice(0, 80))}
      onFocus={() => setEditing(true)}
      onBlur={(event) => {
        setEditing(false);
        onCommitViewName(cameraId, event.target.value);
      }}
    />
  );
}
