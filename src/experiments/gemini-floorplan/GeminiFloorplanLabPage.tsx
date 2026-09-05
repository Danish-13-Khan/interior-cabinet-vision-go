import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../../styles/gemini-floorplan-lab.css";
import { LabStatusBar } from "./LabStatusBar";
import { hasGeminiApiKeyConfigured } from "./labFlags";
import { buildLabStatus } from "./labStatus";
import { Placeholder3dPane } from "./Placeholder3dPane";
import { UploadZone } from "./UploadZone";

export function GeminiFloorplanLabPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const hasKey = hasGeminiApiKeyConfigured();
  const status = buildLabStatus({ hasKey, fileName });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onFile(file: File | null) {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setFileName(file?.name ?? null);
  }

  return (
    <div className="gfl-page">
      <header className="gfl-top">
        <div>
          <p className="gfl-eyebrow">Lab · Phase 0</p>
          <h1>Gemini floor-plan Vision</h1>
        </div>
        <Link className="gfl-back" to="/">
          Back to site
        </Link>
      </header>
      <LabStatusBar status={status} />
      <div className="gfl-grid">
        <UploadZone fileName={fileName} previewUrl={previewUrl} onFile={onFile} />
        <Placeholder3dPane />
      </div>
    </div>
  );
}
