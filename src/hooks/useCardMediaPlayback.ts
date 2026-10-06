import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  claimCardClipPlayback,
  getActiveCardClipKey,
  releaseCardClipPlayback,
  subscribeActiveCardClip,
} from "../components/cardMedia/cardClipPlayback";
import { readNetworkSaveData } from "../components/cardMedia/networkSaveData";
import {
  getTouchPrimaryClipKey,
  registerTouchCardClip,
  subscribeTouchPrimaryClip,
} from "../components/cardMedia/touchCardClipRegistry";

const HOVER_DELAY_MS = 150;
/** Matches the `.card-media__video` opacity transition; the video unmounts once it has faded. */
export const CARD_CLIP_FADE_MS = 220;

type Options = {
  clipAvailable: boolean;
  clipDismissed: boolean;
  clipDisabled: boolean;
};

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useCardMediaPlayback({ clipAvailable, clipDismissed, clipDisabled }: Options) {
  const reactId = useId();
  const clipKey = `card-clip-${reactId}`;
  const rootRef = useRef<HTMLSpanElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoverRest, setHoverRest] = useState(false);
  const [cardFocused, setCardFocused] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [mountVideo, setMountVideo] = useState(false);

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const coarsePointer = useMediaQuery("(hover: none)");
  const saveData = useSyncExternalStore(() => () => {}, readNetworkSaveData, () => false);
  const activeClipKey = useSyncExternalStore(subscribeActiveCardClip, getActiveCardClipKey, () => null);
  const touchPrimaryKey = useSyncExternalStore(subscribeTouchPrimaryClip, getTouchPrimaryClipKey, () => null);

  const clipsAllowed = clipAvailable && !clipDismissed && !clipDisabled && !reducedMotion && !saveData;
  const wantsClip = clipsAllowed && (cardFocused || hoverRest || (coarsePointer && touchPrimaryKey === clipKey));
  const ownsPlayback = wantsClip && activeClipKey === clipKey;

  const clearTimer = (timer: { current: ReturnType<typeof setTimeout> | null }) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => () => {
    clearTimer(hoverTimer);
    clearTimer(unmountTimer);
    releaseCardClipPlayback(clipKey);
  }, [clipKey]);

  useEffect(() => {
    if (!clipsAllowed || !coarsePointer) return undefined;
    registerTouchCardClip(clipKey, rootRef.current);
    return () => registerTouchCardClip(clipKey, null);
  }, [clipKey, clipsAllowed, coarsePointer]);

  useEffect(() => {
    const card = rootRef.current?.closest("a,button");
    if (!card) return undefined;
    const syncFocus = () => setCardFocused(card.matches(":focus-visible"));
    card.addEventListener("focusin", syncFocus);
    card.addEventListener("focusout", syncFocus);
    return () => {
      card.removeEventListener("focusin", syncFocus);
      card.removeEventListener("focusout", syncFocus);
    };
  }, []);

  // A card that starts wanting the clip takes it from whichever card has it.
  useEffect(() => {
    if (wantsClip) claimCardClipPlayback(clipKey);
    else releaseCardClipPlayback(clipKey);
  }, [clipKey, wantsClip]);

  // A card that still wants it (say, keyboard focus) takes it back once nobody holds it.
  useEffect(() => {
    if (wantsClip && activeClipKey === null) claimCardClipPlayback(clipKey);
  }, [activeClipKey, clipKey, wantsClip]);

  // Owning mounts the video; losing it fades the video out, then unmounts it.
  useEffect(() => {
    if (ownsPlayback) {
      clearTimer(unmountTimer);
      setMountVideo(true);
      return;
    }
    if (!mountVideo || unmountTimer.current) return;
    setVideoVisible(false);
    unmountTimer.current = setTimeout(() => {
      unmountTimer.current = null;
      setMountVideo(false);
    }, CARD_CLIP_FADE_MS);
  }, [mountVideo, ownsPlayback]);

  const onPointerEnter = useCallback(() => {
    if (coarsePointer || !clipsAllowed) return;
    clearTimer(hoverTimer);
    hoverTimer.current = setTimeout(() => setHoverRest(true), HOVER_DELAY_MS);
  }, [clipsAllowed, coarsePointer]);

  const onPointerLeave = useCallback(() => {
    clearTimer(hoverTimer);
    setHoverRest(false);
  }, []);

  const onVideoPlaying = useCallback(() => {
    if (unmountTimer.current) return;
    setVideoVisible(true);
  }, []);

  return {
    rootRef,
    mountVideo,
    /** True while this card should be playing; false starts the fade-out. */
    playing: ownsPlayback,
    videoVisible,
    showPlanCrossfade: !clipsAllowed && !clipDismissed,
    onPointerEnter,
    onPointerLeave,
    onVideoPlaying,
  };
}
