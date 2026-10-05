import {
  instantiateProjectTemplate,
  lookupBuiltInCatalogTemplate,
} from "../catalog";
import {
  instantiateApartmentTemplate,
  lookupApartmentTemplate,
} from "../apartmentTemplates";
import { applyLivingRoomStyle } from "./stylePresets";
import { applyPlannerStarterTemplate, type PlannerStarterTemplate } from "./plannerStarters";
import { createLivingRoomStarterProject } from "./preset";
import { createUniqueLivingRoomIdFactory } from "./ids";
import type { LivingRoomStyleId } from "./stylePresets";
import type { InteriorProject } from "../interiorProject";

export type CreateLivingRoomStarterOptions = {
  projectName?: string;
  styleId?: LivingRoomStyleId;
  template?: PlannerStarterTemplate;
  catalogTemplateId?: string;
  /** Product apartment open — uses unique ids so two Studios never clash autosave. */
  apartmentTemplateId?: string;
  /** Keep deterministic ids for authoring / tests (default unique for product). */
  uniqueIds?: boolean;
  now?: string;
  projectId?: string;
};

export function buildLivingRoomStarterDocument(
  options: CreateLivingRoomStarterOptions = {},
): { document: InteriorProject; label: string } {
  const projectId = options.projectId ?? `living-room-${Date.now()}`;
  const now = options.now ?? new Date().toISOString();

  if (options.apartmentTemplateId) {
    const spec = lookupApartmentTemplate(options.apartmentTemplateId);
    if (!spec) {
      throw new Error(`Unknown apartment template ${options.apartmentTemplateId}`);
    }
    const unique = options.uniqueIds !== false;
    const document = instantiateApartmentTemplate(options.apartmentTemplateId, {
      now,
      idFactory: unique ? createUniqueLivingRoomIdFactory() : undefined,
    });
    return {
      document: {
        ...document,
        id: projectId,
        name: options.projectName?.trim() || spec.name,
        updatedAt: now,
      },
      label: `${spec.name} apartment`,
    };
  }

  if (options.catalogTemplateId) {
    const template = lookupBuiltInCatalogTemplate(options.catalogTemplateId);
    if (!template) {
      throw new Error(`Unknown catalog template ${options.catalogTemplateId}`);
    }
    return {
      document: instantiateProjectTemplate(template, {
        projectId,
        projectName: options.projectName,
        now,
      }),
      label: `${template.name} template`,
    };
  }

  const base = createLivingRoomStarterProject({
    projectId,
    projectName: options.projectName,
    now,
  });
  const styled = options.styleId && options.styleId !== "warm-contemporary"
    ? applyLivingRoomStyle(base, options.styleId)
    : base;
  const document = applyPlannerStarterTemplate(styled, options.template ?? "blank-room");
  const label = options.template === "wardrobe-wall" ? "wardrobe wall plan"
    : options.template === "l-room" ? "L-room plan"
    : options.template === "2-room-flat" ? "2-room flat plan"
    : "blank plan";
  return { document, label };
}
