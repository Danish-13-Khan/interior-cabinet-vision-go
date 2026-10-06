import { useMemo } from "react";
import {
  LIVING_ROOM_CATALOG_TEMPLATE_ID,
  lookupBuiltInCatalogFile,
  lookupBuiltInCatalogTemplates,
} from "../../domain/catalog";
import { CatalogTemplateThumb } from "./CatalogTemplateThumb";

type Props = {
  onCreate: (catalogTemplateId: string) => void;
};

/** Popular catalog templates on project home — Living Room first. */
export function InteriorsPopularTemplates({ onCreate }: Props) {
  const templates = useMemo(() => {
    const list = lookupBuiltInCatalogTemplates();
    return [...list].sort((a, b) => {
      if (a.id === LIVING_ROOM_CATALOG_TEMPLATE_ID) return -1;
      if (b.id === LIVING_ROOM_CATALOG_TEMPLATE_ID) return 1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  if (templates.length === 0) return null;

  return (
    <section className="planner-v2-starts interiors-popular-templates" data-testid="interiors-popular-templates">
      <header className="app-home-section-head">
        <h2>Start from a template</h2>
        <small>A shell or a furnished room, editable in 2D and 3D</small>
      </header>
      <div>
        {templates.map((template) => {
          const file = lookupBuiltInCatalogFile(template.images.thumbnailId);
          const objectKey = file?.kind === "image" ? file.objectKey : null;
          return (
            <button
              type="button"
              key={template.id}
              data-testid={`catalog-template-${template.id}`}
              data-template-id={template.id}
              onClick={() => onCreate(template.id)}
            >
              {objectKey ? (
                <CatalogTemplateThumb objectKey={objectKey} width={160} height={120} />
              ) : (
                <span className="interiors-template-thumb-fallback" aria-hidden />
              )}
              <strong>{template.name}</strong>
              <small>{template.description}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
