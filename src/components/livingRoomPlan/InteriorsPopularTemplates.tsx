import { useMemo, useState } from "react";
import {
  LIVING_ROOM_CATALOG_TEMPLATE_ID,
  lookupBuiltInCatalogFile,
  lookupBuiltInCatalogTemplates,
  type ProjectTemplate,
} from "../../domain/catalog";
import { catalogPosterFromObjectKey, type CatalogPosterRef } from "../../domain/templateCardMedia";
import { CardMedia } from "../cardMedia";

/** The catalog's own thumbnail: a v2 WebP pair for srcset, or a legacy single image. */
function catalogPoster(template: ProjectTemplate): CatalogPosterRef | null {
  const file = lookupBuiltInCatalogFile(template.images.thumbnailId);
  return file?.kind === "image" ? catalogPosterFromObjectKey(file.objectKey) : null;
}

type Props = {
  onCreate: (catalogTemplateId: string) => void;
};

/** Popular catalog templates on project home — Living Room first. */
export function InteriorsPopularTemplates({ onCreate }: Props) {
  const [clipLockedId, setClipLockedId] = useState<string | null>(null);
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
        {templates.map((template) => (
          <button
            type="button"
            key={template.id}
            data-testid={`catalog-template-${template.id}`}
            data-template-id={template.id}
            onClick={() => {
              setClipLockedId(template.id);
              onCreate(template.id);
            }}
          >
            <CardMedia
              templateId={template.id}
              poster={catalogPoster(template)}
              fallbackClassName="interiors-template-thumb-fallback"
              width={160}
              height={120}
              clipDismissed={clipLockedId === template.id}
              clipDisabled={clipLockedId !== null}
            />
            <strong>{template.name}</strong>
            <small>{template.description}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
