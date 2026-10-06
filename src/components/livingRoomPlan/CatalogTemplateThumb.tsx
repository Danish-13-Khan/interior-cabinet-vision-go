import {
  cardPosterSrcSet,
  catalogPosterFromObjectKey,
  type CatalogPosterRef,
} from "../../domain/templateCardMedia";

type Props = {
  objectKey: string;
  width: number;
  height: number;
};

export function CatalogTemplateThumb({ objectKey, width, height }: Props) {
  const ref: CatalogPosterRef = catalogPosterFromObjectKey(objectKey);
  const base = import.meta.env.BASE_URL;
  if (ref.kind === "single") {
    return (
      <img src={`${base}${ref.src}`} alt="" width={width} height={height} loading="lazy" decoding="async" />
    );
  }
  const { poster } = ref;
  return (
    <img
      src={`${base}${poster.w800}`}
      srcSet={cardPosterSrcSet(poster, base)}
      sizes={`${width}px`}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}
