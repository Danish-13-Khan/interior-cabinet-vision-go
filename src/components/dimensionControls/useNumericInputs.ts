import { useEffect, useState } from "react";
import {
  clampCabinetDepth,
  clampCabinetHeight,
  clampCabinetWidth,
  clampDrawerCount,
  clampShelfCount,
  clampToeKickHeight,
  clampToeKickInset,
  type CabinetConfig,
  type CabinetPlacement,
} from "../../domain/cabinetDimensions";
import type { NumericInputKey } from "./types";

export function useNumericInputs(
  config: CabinetConfig,
  selectedPlacement: CabinetPlacement | null,
  onConfigChange: (config: Partial<CabinetConfig>) => void,
  onPlacementChange: (axis: "x" | "y" | "z", value: number) => void,
) {
  const [inputs, setInputs] = useState<Record<NumericInputKey, string>>({
    width: String(config.dimensions.width),
    height: String(config.dimensions.height),
    depth: String(config.dimensions.depth),
    shelfCount: String(config.shelfCount),
    drawerCount: String(config.drawerCount ?? 0),
    toeKickHeight: String(config.toeKickHeight),
    toeKickInset: String(config.toeKickInset),
    placementX: String(selectedPlacement?.x ?? 0),
    placementY: String(selectedPlacement?.y ?? 0),
    placementZ: String(selectedPlacement?.z ?? 0),
  });

  useEffect(() => {
    setInputs({
      width: String(config.dimensions.width),
      height: String(config.dimensions.height),
      depth: String(config.dimensions.depth),
      shelfCount: String(config.shelfCount),
      drawerCount: String(config.drawerCount ?? 0),
      toeKickHeight: String(config.toeKickHeight),
      toeKickInset: String(config.toeKickInset),
      placementX: String(selectedPlacement?.x ?? 0),
      placementY: String(selectedPlacement?.y ?? 0),
      placementZ: String(selectedPlacement?.z ?? 0),
    });
  }, [
    config.dimensions.depth,
    config.dimensions.height,
    config.dimensions.width,
    config.shelfCount,
    config.drawerCount,
    config.toeKickHeight,
    config.toeKickInset,
    selectedPlacement?.x,
    selectedPlacement?.y,
    selectedPlacement?.z,
  ]);

  function handleNumericInputChange(key: NumericInputKey, value: string) {
    setInputs((currentInputs) => ({
      ...currentInputs,
      [key]: value,
    }));

    if (value.trim() === "") {
      return;
    }

    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      return;
    }

    switch (key) {
      case "width":
        onConfigChange({
          dimensions: {
            ...config.dimensions,
            width: clampCabinetWidth(parsedValue),
          },
        });
        return;
      case "height":
        onConfigChange({
          dimensions: {
            ...config.dimensions,
            height: clampCabinetHeight(parsedValue),
          },
        });
        return;
      case "depth":
        onConfigChange({
          dimensions: {
            ...config.dimensions,
            depth: clampCabinetDepth(parsedValue),
          },
        });
        return;
      case "shelfCount":
        onConfigChange({ shelfCount: clampShelfCount(parsedValue) });
        return;
      case "drawerCount":
        onConfigChange({ drawerCount: clampDrawerCount(parsedValue) });
        return;
      case "toeKickHeight":
        onConfigChange({ toeKickHeight: clampToeKickHeight(parsedValue) });
        return;
      case "toeKickInset":
        onConfigChange({ toeKickInset: clampToeKickInset(parsedValue) });
        return;
      case "placementX":
        onPlacementChange("x", parsedValue);
        return;
      case "placementY":
        onPlacementChange("y", parsedValue);
        return;
      case "placementZ":
        onPlacementChange("z", parsedValue);
        return;
    }
  }

  function handleBlur(key: NumericInputKey) {
    const currentValueMap: Record<NumericInputKey, number> = {
      width: config.dimensions.width,
      height: config.dimensions.height,
      depth: config.dimensions.depth,
      shelfCount: config.shelfCount,
      drawerCount: config.drawerCount ?? 0,
      toeKickHeight: config.toeKickHeight,
      toeKickInset: config.toeKickInset,
      placementX: selectedPlacement?.x ?? 0,
      placementY: selectedPlacement?.y ?? 0,
      placementZ: selectedPlacement?.z ?? 0,
    };

    setInputs((currentInputs) => ({
      ...currentInputs,
      [key]: String(currentValueMap[key]),
    }));
  }

  return { inputs, handleNumericInputChange, handleBlur };
}
