import { useState } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import {
  assembleClientPresentationFiles,
  buildClientPresentationPackage,
  clientPresentationPackageDirectory,
  clientPreviewExportStatusMessage,
  exportClientPresentationPdf,
  packageFilePath,
  type LivingRoomRenderResult,
  type StillProvenance,
  type AcceptedStillPng,
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
    acceptedStills: StillProvenance[] = [],
    acceptedStillPngs: AcceptedStillPng[] = [],
  ) {
    setBusy(true);
    setStatus("");
    try {
      const { packageData, files } = await assembleClientPresentationFiles(
        project,
        render,
        new Date().toISOString(),
        acceptedStills,
        acceptedStillPngs,
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
      const packageDirectory = clientPresentationPackageDirectory(pdfPath);

      for (const file of files) {
        const target = file.fileName.endsWith(".pdf")
          ? packageFilePath(packageDirectory, file.fileName)
          : packageFilePath(packageDirectory, file.fileName);
        if (typeof file.contents === "string") {
          await writeTextFile(target, file.contents);
        } else {
          await writeBinaryBlob(target, file.contents);
        }
      }
      setStatus(clientPreviewExportStatusMessage(
        Boolean(packageData.heroRenderDataUrl),
        acceptedStills.length,
      ));
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

  async function exportPresentationPdf(
    project: InteriorProject,
    render: LivingRoomRenderResult,
  ) {
    setBusy(true);
    setStatus("");
    try {
      const pack = buildClientPresentationPackage(project, render);
      const path = await promptSavePath({
        title: "Export Presentation PDF",
        defaultPath: pack.fileNames.presentationPdf,
        extensions: ["pdf"],
      });
      if (!path) {
        setStatus("Presentation PDF export cancelled.");
        return;
      }
      await writeBinaryBlob(path, await exportClientPresentationPdf(project, render, pack));
      setStatus("Presentation PDF saved successfully.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Presentation PDF failed: ${error.message}`
          : "Presentation PDF export failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return { status, busy, exportClientPreview, exportPresentationPdf, setStatus };
}
