import type { Object3D } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

/** Node tests have Blob but not FileReader. The exporter only uses these two reads. */
function ensureFileReader(): void {
  if (typeof FileReader !== "undefined") return;
  class Reader {
    result: ArrayBuffer | string | null = null;
    onloadend: (() => void) | null = null;
    readAsArrayBuffer(blob: Blob) {
      void blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        this.onloadend?.();
      });
    }
    readAsDataURL(blob: Blob) {
      void blob.arrayBuffer().then((buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        this.result = `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
        this.onloadend?.();
      });
    }
  }
  (globalThis as unknown as { FileReader: unknown }).FileReader = Reader;
}

export function exportSceneGlb(scene: Object3D): Promise<ArrayBuffer | null> {
  ensureFileReader();
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(scene, (result) => {
      resolve(result instanceof ArrayBuffer ? result : null);
    }, reject, { binary: true });
  });
}
