import type { CabinetType } from "../domain/cabinetDimensions";
import { cabinetTypeLabels } from "../domain/cabinetDimensions";
import { listLibraryGroups } from "../domain/cabinetLibraryCatalog";
import type { CabinetTemplate } from "../domain/cabinetTemplates";
import { PROJECT_STARTER_TEMPLATES } from "../domain/cabinetTemplates";
import type { CabinetFamilyLibraryEntry } from "../domain/workshopLibrary";

type LibraryRailProps = {
  templates: CabinetTemplate[];
  userCabinetPresets?: CabinetFamilyLibraryEntry[];
  onAddFamily: (type: CabinetType) => void;
  onAddLibraryItem: (itemId: string) => void;
  onAddTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onApplyStarter: (starterId: string) => void;
  onOpenLibraryManager?: () => void;
};

export function LibraryRail({
  templates,
  userCabinetPresets = [],
  onAddFamily,
  onAddLibraryItem,
  onAddTemplate,
  onDeleteTemplate,
  onApplyStarter,
  onOpenLibraryManager,
}: LibraryRailProps) {
  const groups = listLibraryGroups(userCabinetPresets);

  return (
    <>
      <div className="rail-section">
        <div className="rail-section-title">
          <span>Cabinet Library</span>
          {onOpenLibraryManager ? (
            <button type="button" className="rail-link-btn" onClick={onOpenLibraryManager}>
              Manage
            </button>
          ) : null}
        </div>
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
                .filter((item) => item.source === "engineered" || item.source === "user")
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="library-item-btn"
                    title={item.description}
                    onClick={() => onAddLibraryItem(item.id)}
                  >
                    <strong>
                      {item.label}
                      {item.source === "user" ? " · user" : ""}
                    </strong>
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
                    {cabinetTypeLabels[template.family]} · v{template.version ?? 1}
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
