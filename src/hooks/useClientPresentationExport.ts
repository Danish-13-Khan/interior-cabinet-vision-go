import { useState } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import {
  assembleClientPresentationFiles,
  siblingPackagePath,
  type LivingRoomRenderResult,
} from "../domain/livingRoom";
import {
  promptSavePath,
  writeBinaryBlob,
  writeTextFile,
} from "../platform/desktopFiles";

export function useClientPresentationExport() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function exportClientPreview(
    project: InteriorProject,
    render: LivingRoomRenderResult | null,
  ) {
    setBusy(true);
    setStatus("");
    try {
      const { packageData, files } = await assembleClientPresentationFiles(
        project,
        render,
      );
      const pdfPath = await promptSavePath({
        title: "Export Client Preview Package",
        defaultPath: packageData.fileNames.presentationPdf,
        extensions: ["pdf"],
      });
      if (!pdfPath) {
        setStatus("Client preview export cancelled.");
        return;
      }

      for (const file of files) {
        const target = file.fileName.endsWith(".pdf")
          ? pdfPath
          : siblingPackagePath(
              pdfPath.replace(/\.pdf$/i, ""),
              file.fileName,
            );
        if (typeof file.contents === "string") {
          await writeTextFile(target, file.contents);
        } else {
          await writeBinaryBlob(target, file.contents);
        }
      }
      setStatus(
        render
          ? "Client preview package exported (PDF, PNG, JSON)."
          : "Client preview package exported (PDF + JSON; render a hero image for PNG).",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Client preview failed: ${error.message}`
          : "Client preview export failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return { status, busy, exportClientPreview, setStatus };
}
