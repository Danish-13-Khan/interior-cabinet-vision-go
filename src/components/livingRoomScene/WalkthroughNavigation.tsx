import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

type WalkthroughNavigationProps = {
  enabled: boolean;
  onExit?: () => void;
};

/** Lightweight first-person navigation for the editable 3D viewport. */
export function WalkthroughNavigation({ enabled, onExit }: WalkthroughNavigationProps) {
  const { camera, gl } = useThree();
  const pressed = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled) return;
    const down = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        pressed.current.clear();
        gl.domElement.blur();
        onExit?.();
        return;
      }
      pressed.current.add(event.key.toLowerCase());
    };
    const up = (event: KeyboardEvent) => pressed.current.delete(event.key.toLowerCase());
    const focus = () => gl.domElement.focus();
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up);
    gl.domElement.addEventListener("pointerdown", focus);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up);
      gl.domElement.removeEventListener("pointerdown", focus);
      pressed.current.clear();
    };
  }, [enabled, gl, onExit]);

  useFrame((_, delta) => {
    if (!enabled || pressed.current.size === 0) return;
    const speed = pressed.current.has("shift") ? 3.2 : 1.55;
    const forward = new Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new Vector3(-forward.z, 0, forward.x);
    const move = new Vector3();
    if (pressed.current.has("w") || pressed.current.has("arrowup")) move.add(forward);
    if (pressed.current.has("s") || pressed.current.has("arrowdown")) move.sub(forward);
    if (pressed.current.has("d") || pressed.current.has("arrowright")) move.add(right);
    if (pressed.current.has("a") || pressed.current.has("arrowleft")) move.sub(right);
    if (move.lengthSq() > 0) camera.position.addScaledVector(move.normalize(), speed * delta);
  });

  return null;
}
