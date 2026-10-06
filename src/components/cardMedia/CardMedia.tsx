import { useEffect, useMemo, useRef } from "react";
import type { ApartmentTemplateId } from "../../domain/apartmentTemplates/types";
import {
  cardClipShouldLoop,
  cardClipSources,
  cardPosterSrcSet,
  findCardMedia,
  type CatalogPosterRef,
  type TemplateCardId,
} from "../../domain/templateCardMedia";
import { useCardMediaPlayback } from "../../hooks/useCardMediaPlayback";

type Props = {
  templateId: TemplateCardId | ApartmentTemplateId | string;
  width: number;
  height: number;
  className?: string;
  /** Poster from elsewhere (a catalog thumbnail); overrides the card-media manifest. */
  poster?: CatalogPosterRef | null;
  /** Class for the empty tile shown when there is no poster at all. */
  fallbackClassName?: string;
  clipDisabled?: boolean;
  clipDismissed?: boolean;
};

export function CardMedia({
  templateId,
  width,
  height,
  className,
  poster,
  fallbackClassName,
  clipDisabled = false,
  clipDismissed = false,
}: Props) {
  const media = useMemo(() => findCardMedia(templateId as TemplateCardId), [templateId]);
  const base = import.meta.env.BASE_URL;
  const posterRef: CatalogPosterRef | null = poster
    ?? (media ? { kind: "srcset", poster: media.poster } : null);
  const planVariants = media?.plan;
  const clip = media?.clip;
  const loop = cardClipShouldLoop(templateId as TemplateCardId);
  const videoRef = useRef<HTMLVideoElement>(null);

  const playback = useCardMediaPlayback({
    clipAvailable: Boolean(clip),
    clipDismissed,
    clipDisabled,
  });

  // Play while this card owns playback; pause (and hold the frame for the fade) when it lets go.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playback.playing) video.play()?.catch(() => {});
    else video.pause();
  }, [playback.mountVideo, playback.playing]);

  if (!posterRef) {
    return (
      <span
        className={[fallbackClassName, className].filter(Boolean).join(" ") || undefined}
        data-card-media-missing={templateId}
        aria-hidden
      />
    );
  }

  const sources = clip ? cardClipSources(clip, base) : null;
  const posterProps = posterRef.kind === "srcset"
    ? { src: `${base}${posterRef.poster.w800}`, srcSet: cardPosterSrcSet(posterRef.poster, base), sizes: `${width}px` }
    : { src: `${base}${posterRef.src}` };

  return (
    <span
      ref={playback.rootRef}
      className={["card-media", className].filter(Boolean).join(" ")}
      data-clip-active={playback.videoVisible ? "true" : undefined}
      onPointerEnter={playback.onPointerEnter}
      onPointerLeave={playback.onPointerLeave}
    >
      <img
        className="card-media__poster"
        {...posterProps}
        alt=""
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
      {planVariants && playback.showPlanCrossfade ? (
        <img
          className="card-media__plan"
          src={`${base}${planVariants.w800}`}
          srcSet={cardPosterSrcSet(planVariants, base)}
          sizes={`${width}px`}
          alt=""
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      {playback.mountVideo && sources ? (
        <video
          ref={videoRef}
          className={`card-media__video${playback.videoVisible ? " is-visible" : ""}`}
          muted
          playsInline
          loop={loop}
          preload="none"
          width={width}
          height={height}
          onPlaying={playback.onVideoPlaying}
        >
          <source src={sources.webm} type="video/webm" />
          <source src={sources.mp4} type="video/mp4" />
        </video>
      ) : null}
    </span>
  );
}
