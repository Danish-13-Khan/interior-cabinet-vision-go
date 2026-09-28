import { useState } from "react";
import {
  livingRoomThumbnailFile,
  livingRoomThumbnailItems,
} from "../../domain/livingRoom/livingRoomThumbnails";
import { CatalogThumbnailStage } from "./CatalogThumbnailStage";

/**
 * Dev-only page for `npm run catalog:render`:
 * `/?catalog-thumb=` lists items, `/?catalog-thumb=<id>` renders one.
 */
export default function CatalogThumbnailPage({ itemId }: { itemId: string }) {
  const [ready, setReady] = useState(false);
  if (!itemId) {
    const list = livingRoomThumbnailItems().map((item) => ({ id: item.id, file: livingRoomThumbnailFile(item.id) }));
    return <pre id="catalog-thumb-list">{JSON.stringify(list)}</pre>;
  }
  return (
    <main data-catalog-thumb-ready={ready ? "true" : "false"} style={{ margin: 0 }}>
      <CatalogThumbnailStage itemId={itemId} onReady={() => setReady(true)} />
    </main>
  );
}
