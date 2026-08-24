export const MILLWORK_SCHEDULE_VERSION = 1 as const;

export const MILLWORK_SCHEDULE_HONESTY_NOTE =
  "Sizes match Plan/Model millimetres. Use the Production Packet for cut parts, costing, and technical sheets.";

export type MillworkScheduleLine = {
  objectId: string;
  name: string;
  category: string;
  kind: string;
  roomId: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  /** Slot → material entity id (authoring truth). */
  materialSlots: Record<string, string>;
  /** Slot → human material name for shop-facing export/preview. */
  materialLabels: Record<string, string>;
  quantity: 1;
};

export type MillworkSchedule = {
  version: typeof MILLWORK_SCHEDULE_VERSION;
  projectId: string;
  projectName: string;
  exportedAt: string;
  roomId: string;
  roomName: string;
  honestyNote: string;
  lines: MillworkScheduleLine[];
};

export type MillworkWorkflowStepId = "place" | "size-finish" | "export";

export type MillworkWorkflowStep = {
  id: MillworkWorkflowStepId;
  label: string;
  detail: string;
  done: boolean;
};

/** Live Plan → Model → Schedule readiness for the salesperson loop. */
export type MillworkWorkflowSnapshot = {
  millworkCount: number;
  softGoodsCount: number;
  readyToExport: boolean;
  steps: readonly MillworkWorkflowStep[];
};
