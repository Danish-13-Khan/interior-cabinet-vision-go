import {
  instantiateProjectTemplate,
  lookupBuiltInCatalogTemplate,
} from "../catalog";
import {
  applyLivingRoomStyle,
  applyPlannerStarterTemplate,
  createLivingRoomStarterProject,
  type LivingRoomStyleId,
  type PlannerStarterTemplate,
} from "../livingRoom";
import type { InteriorProject } from "../interiorProject";

export type CreateLivingRoomStarterOptions = {
  projectName?: string;
  styleId?: LivingRoomStyleId;
  template?: PlannerStarterTemplate;
  catalogTemplateId?: string;
  now?: string;
  projectId?: string;
};

export function buildLivingRoomStarterDocument(
  options: CreateLivingRoomStarterOptions = {},
): { document: InteriorProject; label: string } {
  const projectId = options.projectId ?? `living-room-${Date.now()}`;
  const now = options.now ?? new Date().toISOString();

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
