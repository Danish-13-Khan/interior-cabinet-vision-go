import { createContext, useContext, type ReactNode } from "react";
import type { RenderQuality } from "../domain/interiorProject";

const ModelViewPreviewQualityContext = createContext<RenderQuality | null>(null);

export function ModelViewPreviewProfileProvider({
  quality,
  children,
}: {
  quality: RenderQuality;
  children: ReactNode;
}) {
  return (
    <ModelViewPreviewQualityContext.Provider value={quality}>
      {children}
    </ModelViewPreviewQualityContext.Provider>
  );
}

export function useModelViewPreviewQuality() {
  return useContext(ModelViewPreviewQualityContext);
}
