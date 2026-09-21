import { createModule, LibreDwg, Dwg_Error } from '@mlightcad/libredwg-web';
import wasmUrl from '../../../node_modules/@mlightcad/libredwg-web/wasm/libredwg-web.wasm?url';
import { isAsciiDxfName } from './dwgCadType';
import { parseAsciiDxf } from './dwgDxfParse';
import { buildDwgPreview } from './dwgGeometry';

function request(data: unknown): { buffer: ArrayBuffer; name: string } {
  if (data instanceof ArrayBuffer) return { buffer: data, name: 'preview.dwg' };
  if (data && typeof data === 'object' && 'buffer' in data) {
    const payload = data as { buffer: ArrayBuffer; name?: string };
    if (payload.buffer instanceof ArrayBuffer) return { buffer: payload.buffer, name: payload.name || 'preview.dwg' };
  }
  throw new Error('Could not read the selected file.');
}

self.onmessage = async (event: MessageEvent<unknown>) => {
  try {
    const { buffer, name } = request(event.data);
    if (isAsciiDxfName(name)) {
      const preview = buildDwgPreview(parseAsciiDxf(new TextDecoder().decode(buffer)));
      self.postMessage({ preview });
      return;
    }
    const module = await createModule({ locateFile: () => wasmUrl });
    const reader = LibreDwg.createByWasmInstance(module);
    module.FS.writeFile('preview.dwg', new Uint8Array(buffer));
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
