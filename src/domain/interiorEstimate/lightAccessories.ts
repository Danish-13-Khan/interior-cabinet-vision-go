import type { LightEntity } from "../interiorProject";

export type LightAccessoryLine = {
  id: string;
  label: string;
  category: string;
  unit: "each" | "lm";
  measured: number;
  source: string;
};

/** One driver per 5 m of strip, plus profile and diffuser for the full length. */
export function lightAccessoryLines(light: LightEntity): LightAccessoryLine[] {
  if (light.kind !== "area") return [];
  const metres = Math.max(0, Number(light.parameters.widthMm) / 1000);
  const drivers = Math.max(1, Math.ceil(metres / 5));
  return [
    {
      id: `light:${light.id}:driver`,
      label: `${light.name} · driver`,
      category: "light.driver",
      unit: "each",
      measured: drivers,
      source: `${light.id}: one driver per 5 m of strip`,
    },
    {
      id: `light:${light.id}:profile`,
      label: `${light.name} · profile`,
      category: "light.profile",
      unit: "lm",
      measured: metres,
      source: `${light.id}: aluminium profile follows strip length`,
    },
    {
      id: `light:${light.id}:diffuser`,
      label: `${light.name} · diffuser`,
      category: "light.diffuser",
      unit: "lm",
      measured: metres,
      source: `${light.id}: diffuser follows strip length`,
    },
  ];
}
