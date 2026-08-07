import { useCallback, useEffect, useState } from "react";
import {
  persistRecentFiles,
  readRecentFiles,
  removeRecentFile,
  upsertRecentFile,
  type RecentFileEntry,
} from "../domain/desktopUx";

export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState<RecentFileEntry[]>(() =>
    readRecentFiles(),
  );

  useEffect(() => {
    persistRecentFiles(recentFiles);
  }, [recentFiles]);

  const rememberFile = useCallback((path: string) => {
    setRecentFiles((current) => upsertRecentFile(current, path));
  }, []);

  const forgetFile = useCallback((path: string) => {
    setRecentFiles((current) => removeRecentFile(current, path));
  }, []);

  return {
    recentFiles,
    rememberFile,
    forgetFile,
  };
}
