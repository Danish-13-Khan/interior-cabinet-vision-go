import { describe, expect, it } from "vitest";
import { buildHandoffGate } from "../livingRoom/handoff";
import { instantiateApartmentTemplate } from "./instantiateApartmentTemplate";

const TEMPLATE_IDS = [
  "template:apartment:studio:v1",
  "template:apartment:1bhk:v1",
  "template:apartment:2bhk:v1",
  "template:apartment:3bhk:v1",
];

/**
 * Template cabinets are golden-family cabinets authored by the composers. Engineering
 * must receive them without loss: the room-frame shift, the folded front-system and
 * hosted-appliance parameters, and the finish roles are all carried, so the only gate
 * item left on a fresh template is the revision approval.
 */
describe("apartment template engineering handoff", () => {
  it.each(TEMPLATE_IDS)("%s maps every golden cabinet without loss", (id) => {
    const gate = buildHandoffGate(instantiateApartmentTemplate(id));
    expect(gate.lossyGoldenCount).toBe(0);
    expect(gate.items.map((item) => item.id)).toEqual(["approval"]);
  });
});
