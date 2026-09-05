import { Link } from "react-router-dom";
import "../../styles/gemini-floorplan-lab.css";
import "../../styles/gemini-floorplan-lab-panels.css";
import "../../styles/gemini-floorplan-lab-phase6.css";
import "../../styles/gemini-floorplan-lab-review.css";
import "../../styles/gemini-floorplan-lab-accept.css";
import { AcceptBridgePanel } from "./AcceptBridgePanel";
import { ConfidenceNotesPanel } from "./ConfidenceNotesPanel";
import { FixtureScorecardPanel } from "./FixtureScorecardPanel";
import { GeometryModeToggle } from "./GeometryModeToggle";
import { LabStatusBar } from "./LabStatusBar";
import { PlanReviewOverlay } from "./PlanReviewOverlay";
import { PrivacyNotesPanel } from "./PrivacyNotesPanel";
import { ProposalJsonPanel } from "./ProposalJsonPanel";
import { ReviewEditorPanel } from "./ReviewEditorPanel";
import { RoomShellViewer } from "./RoomShellViewer";
import { UploadZone } from "./UploadZone";
import { useGeminiFloorplanLab } from "./useGeminiFloorplanLab";
import { useLabDocumentScroll } from "./useLabDocumentScroll";

export function GeminiFloorplanLabPage() {
  useLabDocumentScroll();
  const lab = useGeminiFloorplanLab();

  return (
    <div className="gfl-page">
      <header className="gfl-top">
        <div>
          <p className="gfl-eyebrow">Lab · Phase 6D</p>
          <h1>Gemini floor-plan Vision</h1>
        </div>
        <Link className="gfl-back" to="/">
          Back to site
        </Link>
      </header>
      <LabStatusBar status={lab.status} />
      <div className="gfl-grid gfl-grid--3">
        <UploadZone
          fileName={lab.fileName}
          previewUrl={lab.previewUrl}
          uploadError={lab.uploadError}
          busy={lab.busy}
          pdfInfo={lab.pdfInfo}
          pdfPage={lab.pdfPage}
          onFile={lab.onFile}
          onSelectPdfPage={lab.onSelectPdfPage}
        />
        <ProposalJsonPanel
          proposal={lab.proposal}
          rawText={lab.rawText}
          error={lab.extractError}
          validationErrors={lab.validationErrors}
          metrics={lab.metrics}
          busy={lab.busy}
          hasKey={lab.hasKey}
          hasImage={Boolean(lab.file)}
          onRunVision={lab.onRunVision}
          onUseSampleImage={lab.onUseSampleImage}
          onLoadFixture={lab.onLoadFixture}
        />
        <RoomShellViewer proposal={lab.proposal} geometryMode={lab.geometryMode} />
      </div>
      <div className="gfl-grid gfl-grid--geom">
        <GeometryModeToggle
          mode={lab.geometryMode}
          disabled={!lab.hasSourceProposal}
          busy={lab.cvBusy}
          cvNote={lab.cvNote}
          onChange={lab.setGeometryMode}
        />
        <FixtureScorecardPanel
          proposal={lab.proposal}
          mode={lab.geometryMode}
          fixtureHint={lab.fileName}
        />
      </div>
      <div className="gfl-grid gfl-grid--3 gfl-grid--review">
        <PlanReviewOverlay
          proposal={lab.proposal}
          previewUrl={lab.previewUrl}
          selectedWallId={lab.selectedWallId}
          selectedRoomId={lab.selectedRoomId}
          onSelectWall={(id) => lab.setSelectedWallId(id || null)}
          onSelectRoom={(id) => lab.setSelectedRoomId(id || null)}
        />
        {lab.proposal ? (
          <ReviewEditorPanel
            proposal={lab.proposal}
            selectedWallId={lab.selectedWallId}
            selectedRoomId={lab.selectedRoomId}
            onChange={lab.setProposal}
            onSelectWall={(id) => lab.setSelectedWallId(id || null)}
            onSelectRoom={(id) => lab.setSelectedRoomId(id || null)}
            calibrateError={lab.calibrateError}
            onCalibrateError={lab.setCalibrateError}
          />
        ) : (
          <section className="gfl-panel">
            <header className="gfl-panel__head">
              <h2>Edit proposal</h2>
              <p>Load a fixture or run Vision to enable editors.</p>
            </header>
          </section>
        )}
        <ConfidenceNotesPanel proposal={lab.proposal} />
      </div>
      <div className="gfl-grid gfl-grid--accept">
        <AcceptBridgePanel proposal={lab.proposal} />
        <PrivacyNotesPanel />
      </div>
    </div>
  );
}
