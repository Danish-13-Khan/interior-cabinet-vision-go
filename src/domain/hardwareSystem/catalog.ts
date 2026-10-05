import type {
  ApplianceInsertKind,
  CabinetHardwareSpec,
  HardwareItem,
} from "./types";
import { PUSH_HARDWARE_ITEMS } from "./pushHardware";

export const HARDWARE_CATALOG: HardwareItem[] = [
  ...PUSH_HARDWARE_ITEMS,
  {
    id: "hinge-soft",
    label: "Soft-close hinge",
    kind: "hinge",
    costPerUnit: 85,
    softClose: true,
    description: "110° overlay soft-close",
  },
  {
    id: "hinge-standard",
    label: "Standard hinge",
    kind: "hinge",
    costPerUnit: 25,
    softClose: false,
    description: "Basic overlay hinge",
  },
  {
    id: "hinge-spring-free",
    label: "Spring-free hinge (push-to-open)",
    kind: "hinge",
    costPerUnit: 35,
    softClose: false,
    description: "Non soft-close hinge for mechanical push / Tip-On; soft-close fights the latch (Ilyas Q — brand TBD)",
  },
  {
    id: "hinge-inset",
    label: "Inset soft-close hinge",
    kind: "hinge",
    costPerUnit: 95,
    softClose: true,
    description: "For inset door mounts",
  },
  {
    id: "drawer-slide-soft",
    label: "Soft-close drawer slide (pair)",
    kind: "slide",
    costPerUnit: 280,
    softClose: true,
    pair: true,
    lengthMm: 450,
  },
  {
    id: "drawer-slide-standard",
    label: "Standard drawer slide (pair)",
    kind: "slide",
    costPerUnit: 120,
    softClose: false,
    pair: true,
    lengthMm: 450,
  },
  {
    id: "drawer-slide-undermount",
    label: "Undermount soft-close slide (pair)",
    kind: "slide",
    costPerUnit: 420,
    softClose: true,
    pair: true,
    lengthMm: 500,
  },
  {
    id: "handle-bar",
    label: "Bar handle",
    kind: "handle",
    costPerUnit: 95,
  },
  {
    id: "handle-knob",
    label: "Knob handle",
    kind: "handle",
    costPerUnit: 40,
  },
  {
    id: "handle-cup",
    label: "Cup pull",
    kind: "handle",
    costPerUnit: 70,
  },
  // Gola and glass prices are placeholders until supplier rates arrive; labels say so on every quote.
  { id: "gola-l", label: "Gola J / L profile (per m, placeholder price)", kind: "profile", costPerUnit: 450, description: "Under-countertop handleless profile" },
  { id: "gola-c", label: "Gola C profile (per m, placeholder price)", kind: "profile", costPerUnit: 520, description: "Between stacked drawers" },
  { id: "gola-wall", label: "Gola wall-unit profile (per m, placeholder price)", kind: "profile", costPerUnit: 380, description: "Under upper wall cabinets" },
  { id: "door-glass", label: "Door glass, 4 mm clear (per m², placeholder price)", kind: "glass", costPerUnit: 1800, description: "Glazing for in-house glass door frames" },
  {
    id: "shelf-pin",
    label: "Shelf support pin",
    kind: "shelf-pin",
    costPerUnit: 8,
  },
  {
    id: "leg-adj",
    label: "Adjustable leg",
    kind: "leg",
    costPerUnit: 45,
  },
  {
    id: "leg-plinth",
    label: "Plinth clip set",
    kind: "leg",
    costPerUnit: 30,
    description: "For toe-kick / plinth support",
  },
  {
    id: "wall-bracket",
    label: "Wall mounting bracket",
    kind: "bracket",
    costPerUnit: 55,
  },
  {
    id: "wall-rail",
    label: "Wall hanging rail set",
    kind: "bracket",
    costPerUnit: 180,
  },
  {
    id: "connector",
    label: "Cam+dowel connector set",
    kind: "consumable",
    costPerUnit: 12,
  },
  {
    id: "screw-pack",
    label: "Screw pack (50pcs)",
    kind: "consumable",
    costPerUnit: 35,
  },
  {
    id: "basket-wire",
    label: "Wire basket",
    kind: "accessory",
    costPerUnit: 450,
    description: "Pull-out wire storage basket",
  },
  {
    id: "basket-pullout",
    label: "Full-extension pull-out basket",
    kind: "accessory",
    costPerUnit: 980,
  },
  {
    id: "trash-pullout",
    label: "Trash pull-out",
    kind: "accessory",
    costPerUnit: 1200,
    description: "Compatible with sink bases",
  },
  {
    id: "tray-cutlery",
    label: "Cutlery tray",
    kind: "accessory",
    costPerUnit: 220,
  },
];

export const APPLIANCE_INSERT_OPTIONS: Array<{
  value: ApplianceInsertKind;
  label: string;
}> = [
  { value: "none", label: "None" },
  { value: "sink-bowl", label: "Sink bowl" },
  { value: "cooktop", label: "Cooktop cutout" },
  { value: "dishwasher-gap", label: "Dishwasher gap" },
];

export const ACCESSORY_CATALOG_IDS = HARDWARE_CATALOG.filter(
  (item) => item.kind === "accessory",
).map((item) => item.id);

export const DEFAULT_HARDWARE_SPEC: CabinetHardwareSpec = {
  hingeId: "hinge-soft",
  slideId: "drawer-slide-soft",
  handleId: "handle-bar",
  legId: "leg-adj",
  bracketId: "wall-bracket",
  includeShelfPins: true,
  accessories: [],
  insertKind: "none",
  applianceWidthMm: 0,
  applianceHeightMm: 0,
  applianceDepthMm: 0,
};
