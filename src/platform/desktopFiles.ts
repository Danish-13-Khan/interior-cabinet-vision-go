import { enqueueBrowserDownload } from "./browserDownloadQueue";

/** Detect Tauri desktop runtime vs plain browser (GitHub Pages). */
export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ||
      (window as Window & { __TAURI__?: unknown }).__TAURI__,
  );
}

function pickBrowserFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";
    const cleanup = () => {
      input.remove();
    };
    input.addEventListener(
      "change",
      () => {
        const file = input.files?.[0] ?? null;
        cleanup();
        resolve(file);
      },
      { once: true },
    );
    document.body.appendChild(input);
    input.click();
  });
}

export async function promptSavePath(args: {
  title: string;
  defaultPath: string;
  extensions: string[];
}): Promise<string | null> {
  if (!isTauriRuntime()) {
    return args.defaultPath;
  }
  const { save } = await import("@tauri-apps/plugin-dialog");
  return save({
    title: args.title,
    defaultPath: args.defaultPath,
    filters: [{ name: args.title, extensions: args.extensions }],
  });
}

export async function promptOpenPath(args: {
  title: string;
  extensions: string[];
}): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null;
  }
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    title: args.title,
    multiple: false,
    directory: false,
    filters: [{ name: args.title, extensions: args.extensions }],
  });
  if (!selected || Array.isArray(selected)) return null;
  return selected;
}

export async function writeTextFile(path: string, contents: string) {
  if (!isTauriRuntime()) {
    const name = path.split(/[/\\]/).pop() || "download.txt";
    await enqueueBrowserDownload(
      new Blob([contents], { type: "application/octet-stream" }),
      name,
    );
    return;
  }
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("save_project_file", { path, contents });
}

export async function writeBinaryBlob(path: string, blob: Blob) {
  if (!isTauriRuntime()) {
    const name = path.split(/[/\\]/).pop() || "download.bin";
    await enqueueBrowserDownload(blob, name);
    return;
  }
  const { invoke } = await import("@tauri-apps/api/core");
  const { blobToBase64 } = await import("../utils/blobBase64");
  const base64 = await blobToBase64(blob);
  await invoke("save_binary_file", { path, base64Data: base64 });
}

export async function readTextFile(path: string): Promise<string> {
  if (!isTauriRuntime()) {
    throw new Error("Filesystem paths are only available in the desktop app.");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("load_project_file", { path });
}

export async function openTextProjectFile(args: {
  title: string;
  extensions: string[];
}): Promise<{ path: string; contents: string } | null> {
  if (!isTauriRuntime()) {
    const accept = args.extensions.map((ext) => `.${ext}`).join(",");
    const file = await pickBrowserFile(accept || ".json,application/json");
    if (!file) return null;
    return { path: file.name, contents: await file.text() };
  }

  const path = await promptOpenPath(args);
  if (!path) return null;
  const contents = await readTextFile(path);
  return { path, contents };
}
