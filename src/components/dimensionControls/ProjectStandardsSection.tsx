import {
  EDGE_BANDING_OPTIONS,
  FINISHES,
  MATERIAL_PRESETS,
} from "../../domain/materialSystem";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
} from "../../domain/projectStandards";
import type { ProjectPreferences } from "../../domain/cabinetDimensions";

export function ProjectStandardsSection({
  preferences,
  onPreferenceChange,
}: {
  preferences: ProjectPreferences;
  onPreferenceChange: (patch: Partial<ProjectPreferences>) => void;
}) {
  const standards = clampProjectStandards(
    preferences.standards ?? DEFAULT_PROJECT_STANDARDS,
  );

  function patchStandards(patch: Partial<typeof standards>) {
    onPreferenceChange({
      standards: clampProjectStandards({ ...standards, ...patch }),
    });
  }

  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Project Standards</h2>
        <span>Applied to newly added cabinets</span>
      </div>
      <div className="field-grid">
        <div className="field-group">
          <label htmlFor="std-carcass">Carcass thickness</label>
          <select
            id="std-carcass"
            value={standards.carcassThicknessMm}
            onChange={(event) =>
              patchStandards({ carcassThicknessMm: Number(event.currentTarget.value) })
            }
          >
            {[16, 18, 25].map((value) => (
              <option key={value} value={value}>
                {value} mm
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="std-back">Back panel</label>
          <select
            id="std-back"
            value={standards.backPanelThicknessMm}
            onChange={(event) =>
              patchStandards({ backPanelThicknessMm: Number(event.currentTarget.value) })
            }
          >
            {[3, 6, 8].map((value) => (
              <option key={value} value={value}>
                {value} mm
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="std-toe-h">Toe kick height</label>
          <input
            id="std-toe-h"
            type="number"
            min={0}
            max={180}
            step={10}
            value={standards.toeKickHeightMm}
            onChange={(event) =>
              patchStandards({ toeKickHeightMm: Number(event.currentTarget.value) })
            }
          />
        </div>
        <div className="field-group">
          <label htmlFor="std-toe-i">Toe kick inset</label>
          <input
            id="std-toe-i"
            type="number"
            min={0}
            max={120}
            step={10}
            value={standards.toeKickInsetMm}
            onChange={(event) =>
              patchStandards({ toeKickInsetMm: Number(event.currentTarget.value) })
            }
          />
        </div>
        <div className="field-group">
          <label htmlFor="std-material">Material preset</label>
          <select
            id="std-material"
            value={standards.materialPresetId}
            onChange={(event) =>
              patchStandards({
                materialPresetId: event.currentTarget.value as typeof standards.materialPresetId,
              })
            }
          >
            {MATERIAL_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="std-finish">Finish</label>
          <select
            id="std-finish"
            value={standards.finishId}
            onChange={(event) =>
              patchStandards({
                finishId: event.currentTarget.value as typeof standards.finishId,
              })
            }
          >
            {FINISHES.map((finish) => (
              <option key={finish.id} value={finish.id}>
                {finish.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="std-edge">Edge banding</label>
          <select
            id="std-edge"
            value={standards.edgeBandingId}
            onChange={(event) =>
              patchStandards({
                edgeBandingId: event.currentTarget.value as typeof standards.edgeBandingId,
              })
            }
          >
            {EDGE_BANDING_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
