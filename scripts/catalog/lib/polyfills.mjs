/** FileReader polyfill so three/GLTFLoader works under Node. */
export function installGlbPolyfills() {
  if (typeof globalThis.FileReader !== "undefined") return;
  globalThis.FileReader = class FileReaderPolyfill {
    result = null;
    onloadend = null;
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        this.onloadend?.({ target: this });
      });
    }
  };
}
