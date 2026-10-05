import type { CarcassStyle, CaseJoinery, DoorMount, DrawerBoxStyle, ShelfMount } from "./cabinetConstructionSpec";

export const CARCASS_STYLE_OPTIONS: Array<{ value: CarcassStyle; label: string }> = [
  { value: "frameless", label: "Frameless" },
  { value: "face-frame", label: "Face frame" },
];

export const CASE_JOINERY_OPTIONS: Array<{ value: CaseJoinery; label: string; note: string }> = [
  { value: "butt-screw", label: "Butt + screw", note: "Butt joint with confirmat/screw fixings" },
  { value: "dado", label: "Dado / groove", note: "Top and bottom housed in side dados" },
  { value: "rabbet", label: "Rabbet", note: "Rabbeted side edges for top/bottom" },
  { value: "confirmat", label: "Confirmat", note: "Confirmat screw carcass assembly" },
];

export const DOOR_MOUNT_OPTIONS: Array<{ value: DoorMount; label: string }> = [
  { value: "overlay", label: "Overlay" },
  { value: "full-overlay", label: "Full overlay" },
  { value: "inset", label: "Inset" },
];

export const SHELF_MOUNT_OPTIONS: Array<{ value: ShelfMount; label: string; note: string }> = [
  {
    value: "adjustable-pins",
    label: "Adjustable pins",
    note: "Adjustable on shelf pins; front edge setback",
  },
  {
    value: "fixed-dado",
    label: "Fixed dado",
    note: "Fixed shelf housed in side dados",
  },
  {
    value: "fixed-screw",
    label: "Fixed screw",
    note: "Fixed shelf screwed to cleats/sides",
  },
];

export const DRAWER_BOX_STYLE_OPTIONS: Array<{
  value: DrawerBoxStyle;
  label: string;
  note: string;
}> = [
  { value: "butt-screw", label: "Butt + screw", note: "Butt-joint drawer box with screws" },
  { value: "dado-bottom", label: "Dado bottom", note: "Drawer bottom housed in side grooves" },
  { value: "dovetail", label: "Dovetail", note: "Dovetailed drawer box corners" },
];
