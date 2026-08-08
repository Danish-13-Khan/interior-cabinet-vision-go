import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { Camera } from "three";

export function SceneCaptureBridge({
  onCanvasReady,
}: {
  onCanvasReady: (element: HTMLCanvasElement) => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    onCanvasReady(gl.domElement);
  }, [gl, onCanvasReady]);

  return null;
}

export function SceneViewportBridge({
  onViewportChange,
}: {
  onViewportChange: (camera: Camera, size: { width: number; height: number }) => void;
}) {
  const { camera, size } = useThree();

  useEffect(() => {
    onViewportChange(camera, size);
  }, [camera, onViewportChange, size]);

  return null;
}

export function captureCanvasThumbnail(canvas: HTMLCanvasElement | null): string | null {
  if (!canvas) return null;
  try {
    return canvas.toDataURL("image/png", 1);
  } catch {
    return null;
  }
}
