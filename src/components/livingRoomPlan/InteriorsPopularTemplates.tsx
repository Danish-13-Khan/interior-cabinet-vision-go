import { useMemo } from "react";
import {
  LIVING_ROOM_CATALOG_TEMPLATE_ID,
  lookupBuiltInCatalogFile,
  lookupBuiltInCatalogTemplates,
  type ProjectTemplate,
} from "../../domain/catalog";
import { publicAssetUrl } from "../../utils/publicAssetUrl";

type Props = {
  onCreate: (catalogTemplateId: string) => void;
};

function templateThumbnailUrl(template: ProjectTemplate): string | null {
  const file = lookupBuiltInCatalogFile(template.images.thumbnailId);
  if (!file || file.kind !== "image") return null;
  return publicAssetUrl(file.objectKey);
}

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
      <header>
        <span>Popular templates</span>
        <small>Start from a furnished room — editable in 2D and 3D</small>
      </header>
      <div>
        {templates.map((template) => {
          const thumb = templateThumbnailUrl(template);
          return (
            <button
              type="button"
              key={template.id}
              data-testid={`catalog-template-${template.id}`}
              data-template-id={template.id}
              onClick={() => onCreate(template.id)}
            >
              {thumb ? (
                <img src={thumb} alt="" loading="lazy" width={160} height={120} />
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
