import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  getFootprintDimensions,
  millimetresToMetres,
} from "../../domain/cabinetDimensions";
import type { CameraControllerProps } from "./types";
import { getCabinetWorldCenter, getSceneTarget } from "./worldCoords";

export function CameraController({
  items,
  roomDimensions,
  selectedCabinetId,
  viewPreset,
  fitVersion,
  controlsRef,
}: CameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    const target = getSceneTarget(items, selectedCabinetId);
    const extents = items.reduce(
      (accumulator, item) => {
        const center = getCabinetWorldCenter(item);
        const footprint = getFootprintDimensions(item.config.dimensions, item.placement.rotation);
        accumulator.width = Math.max(
          accumulator.width,
          Math.abs(center[0] - target.x) + footprint.width / 2000,
        );
        accumulator.depth = Math.max(
          accumulator.depth,
          Math.abs(center[2] - target.z) + footprint.depth / 2000,
        );
        accumulator.height = Math.max(accumulator.height, center[1] + item.config.dimensions.height / 2000);
        return accumulator;
      },
      {
        width: millimetresToMetres(roomDimensions.widthMm) / 2,
        height: millimetresToMetres(roomDimensions.heightMm) * 0.5,
        depth: millimetresToMetres(roomDimensions.depthMm) / 2,
      },
    );
    const span = Math.max(extents.width * 2, extents.height, extents.depth * 2);
    const distance = span * 1.1 + 1.6;

    switch (viewPreset) {
      case "front":
        camera.position.set(target.x, target.y + extents.height * 0.08, target.z + distance);
        break;
      case "side":
        camera.position.set(target.x + distance, target.y + extents.height * 0.08, target.z);
        break;
      case "top":
        camera.position.set(target.x + 0.001, target.y + distance, target.z + 0.001);
        break;
      default:
        camera.position.set(
          target.x + distance * 0.82,
          target.y + distance * 0.52,
          target.z + distance * 0.7,
        );
        break;
    }

    controlsRef.current?.target.copy(target);
    controlsRef.current?.update();
  }, [camera, controlsRef, fitVersion, items, roomDimensions.depthMm, roomDimensions.heightMm, roomDimensions.widthMm, selectedCabinetId, viewPreset]);

  return null;
}
