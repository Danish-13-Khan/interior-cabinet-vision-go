import type { CabinetType } from "../domain/cabinetDimensions";
import { cabinetTypeLabels } from "../domain/cabinetDimensions";
import { listLibraryGroups } from "../domain/cabinetLibraryCatalog";
import type { CabinetTemplate } from "../domain/cabinetTemplates";
import {
  PROJECT_STARTER_TEMPLATES,
} from "../domain/cabinetTemplates";

type LibraryRailProps = {
  templates: CabinetTemplate[];
  onAddFamily: (type: CabinetType) => void;
  onAddLibraryItem: (itemId: string) => void;
  onAddTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onApplyStarter: (starterId: string) => void;
};

export function LibraryRail({
  templates,
  onAddFamily,
  onAddLibraryItem,
  onAddTemplate,
  onDeleteTemplate,
  onApplyStarter,
}: LibraryRailProps) {
  const groups = listLibraryGroups();

  return (
    <>
      <div className="rail-section">
        <div className="rail-section-title">Cabinet Library</div>
        {groups.map((group) => (
          <div key={group.id} className="palette-library-group">
            <div className="palette-section-label">{group.label}</div>
            <div className="palette-family-grid">
              {group.families.map((type) => (
                <button
                  key={type}
                  type="button"
                  className="palette-family-btn"
                  title={`Add default ${cabinetTypeLabels[type]}`}
                  onClick={() => onAddFamily(type)}
                >
                  <span className="palette-cat-icon">
                    {type === "drawer"
                      ? "▤"
                      : type === "sink"
                        ? "◫"
                        : type === "corner"
                          ? "◩"
                          : type === "open-shelf"
                            ? "☰"
                            : type === "wall"
                              ? "⬒"
                              : type === "tall" || type === "almirah"
                                ? "▥"
                                : "▦"}
                  </span>
                  <span className="palette-cat-label">{cabinetTypeLabels[type]}</span>
                </button>
              ))}
            </div>
            <div className="library-item-list">
              {group.items
                .filter((item) => item.source === "engineered")
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="library-item-btn"
                    title={item.description}
                    onClick={() => onAddLibraryItem(item.id)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rail-section">
        <div className="rail-section-title">
          <span>My Templates</span>
          <span className="rail-count">{templates.length}</span>
        </div>
        {templates.length === 0 ? (
          <p className="rail-empty">Save a selected cabinet as a template from Properties.</p>
        ) : (
          <div className="library-item-list">
            {templates.map((template) => (
              <div key={template.id} className="template-rail-row">
                <button
                  type="button"
                  className="library-item-btn"
                  title={template.description}
                  onClick={() => onAddTemplate(template.id)}
                >
                  <strong>{template.name}</strong>
                  <span>
                    {cabinetTypeLabels[template.family]} · reusable preset
                  </span>
                </button>
                <button
                  type="button"
                  className="template-delete-btn"
                  title="Delete template"
                  onClick={() => onDeleteTemplate(template.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rail-section">
        <div className="rail-section-title">Project Starters</div>
        <div className="library-item-list">
          {PROJECT_STARTER_TEMPLATES.map((starter) => (
            <button
              key={starter.id}
              type="button"
              className="library-item-btn"
              title={starter.description}
              onClick={() => onApplyStarter(starter.id)}
            >
              <strong>{starter.label}</strong>
              <span>{starter.description}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
