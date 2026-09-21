export type SubmenuSide = "right" | "left";
export type SubmenuVertical = "down" | "up";

export type SubmenuPlacement = {
  side: SubmenuSide;
  vertical: SubmenuVertical;
  maxHeight: number;
};

const MENU_MARGIN = 8;
const SUBMENU_MAX_HEIGHT = 320;
const SUBMENU_MIN_HEIGHT = 48;

/** Flip a flyout left/up when it would overflow the viewport. */
export function placeContextSubmenu(args: {
  trigger: { top: number; right: number; bottom: number; left: number };
  submenu: { width: number; height: number };
  viewport: { width: number; height: number };
  margin?: number;
}): SubmenuPlacement {
  const margin = args.margin ?? MENU_MARGIN;
  const spaceRight = args.viewport.width - args.trigger.right - margin;
  const spaceLeft = args.trigger.left - margin;
  const side: SubmenuSide =
    args.submenu.width <= spaceRight || spaceRight >= spaceLeft ? "right" : "left";

  const spaceDown = args.viewport.height - args.trigger.top - margin;
  const spaceUp = args.trigger.bottom - margin;
  const vertical: SubmenuVertical =
    args.submenu.height <= spaceDown || spaceDown >= spaceUp ? "down" : "up";
  const available = vertical === "down" ? spaceDown : spaceUp;
  return {
    side,
    vertical,
    maxHeight: Math.max(SUBMENU_MIN_HEIGHT, Math.min(SUBMENU_MAX_HEIGHT, available)),
  };
}
