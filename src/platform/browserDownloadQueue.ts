/** Serialize browser anchor downloads so multi-file exports are not dropped. */
let browserDownloadQueue: Promise<void> = Promise.resolve();

const BROWSER_DOWNLOAD_GAP_MS = 250;

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function enqueueBrowserDownload(blob: Blob, fileName: string): Promise<void> {
  const run = browserDownloadQueue.then(
    () => new Promise<void>((resolve) => {
      triggerBrowserDownload(blob, fileName);
      window.setTimeout(resolve, BROWSER_DOWNLOAD_GAP_MS);
    }),
  );
  browserDownloadQueue = run.catch(() => undefined);
  return run;
}
