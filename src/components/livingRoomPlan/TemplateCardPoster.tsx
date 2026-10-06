import { useMemo } from "react";
import type { ApartmentTemplateId } from "../../domain/apartmentTemplates/types";
import {
  findCardMedia,
  cardPosterSrcSet,
  type CardMediaVariantPaths,
  type TemplateCardId,
} from "../../domain/templateCardMedia";

type Props = {
  templateId: TemplateCardId | ApartmentTemplateId;
  /** When set, overrides manifest paths (e.g. catalog thumbnail objectKey). */
  poster?: CardMediaVariantPaths;
  plan?: boolean;
  width: number;
  height: number;
  className?: string;
};

export function TemplateCardPoster({ templateId, poster, plan = false, width, height, className }: Props) {
  const media = useMemo(() => findCardMedia(templateId), [templateId]);
  const variants = poster ?? (plan ? media?.plan : media?.poster);
  const base = import.meta.env.BASE_URL;
  if (!variants) return <span className={className} data-card-media-missing={templateId} aria-hidden />;

  return (
    <img
      className={className}
      src={`${base}${variants.w800}`}
      srcSet={cardPosterSrcSet(variants, base)}
      sizes={`${width}px`}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}
