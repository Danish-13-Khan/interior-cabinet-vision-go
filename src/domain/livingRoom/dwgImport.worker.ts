import { createModule, LibreDwg, Dwg_Error } from '@mlightcad/libredwg-web';
import wasmUrl from '../../../node_modules/@mlightcad/libredwg-web/wasm/libredwg-web.wasm?url';
import { buildDwgPreview } from './dwgGeometry';

self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  try {
    const module = await createModule({ locateFile: () => wasmUrl });
    const reader = LibreDwg.createByWasmInstance(module);
    module.FS.writeFile('preview.dwg', new Uint8Array(event.data));
    const result = module.dwg_read_file('preview.dwg');
    module.FS.unlink('preview.dwg');
    if (result.error & Dwg_Error.OUTOFMEM) {
      if (result.data) module.dwg_abandon(result.data);
      throw new Error('DWG reader ran out of memory. Try a smaller drawing.');
    }
    const ptr = result.data;
    try {
      if (!ptr || result.error >= Dwg_Error.CLASSESNOTFOUND) {
        throw new Error(`LibreDWG could not reliably read this drawing (error ${result.error}). Try another DWG version.`);
      }
      const { database, stats } = reader.convertEx(ptr);
      const preview = buildDwgPreview(database, stats.unknownEntityCount);
      if (result.error) preview.omitted[`Parser warning flags ${result.error}; content may be incomplete`] = 1;
      self.postMessage({ preview });
    } finally { if (ptr) reader.dwg_free(ptr); }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'DWG import failed.' });
  }
};
