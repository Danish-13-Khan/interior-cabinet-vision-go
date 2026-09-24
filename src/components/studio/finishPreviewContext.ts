import { createContext, useContext } from "react";

export type FinishPreviewApi = {
  setOverrides: (overrides: Record<string, string>) => void;
};

export const FinishPreviewContext = createContext<FinishPreviewApi | null>(null);

export function useFinishPreview() {
  return useContext(FinishPreviewContext);
}
