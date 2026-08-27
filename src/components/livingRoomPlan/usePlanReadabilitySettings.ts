import { useEffect, useState } from "react";
import {
  DEFAULT_PLAN_READABILITY,
  type PlanReadabilitySettings,
} from "../../domain/livingRoom";

const STORAGE_KEY = "floorplanner.plan-readability.v1";

function loadSettings(): PlanReadabilitySettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return {
      unit: ["mm", "cm", "m", "ft-in"].includes(parsed?.unit) ? parsed.unit : "mm",
      alwaysShowWallLengths: Boolean(parsed?.alwaysShowWallLengths),
      visualStyle: parsed?.visualStyle === "line" ? "line" : "fill",
    };
  } catch {
    return DEFAULT_PLAN_READABILITY;
  }
}

export function usePlanReadabilitySettings() {
  const [settings, setSettings] = useState<PlanReadabilitySettings>(loadSettings);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);
  function update(patch: Partial<PlanReadabilitySettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }
  return { settings, update };
}
