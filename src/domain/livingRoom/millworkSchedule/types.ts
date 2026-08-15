export const MILLWORK_SCHEDULE_VERSION = 1 as const;

export const MILLWORK_SCHEDULE_HONESTY_NOTE =
  "Sizes match Plan/Model millimetres. Not a cutlist, price, or CNC program.";

export type MillworkScheduleLine = {
  objectId: string;
  name: string;
  category: string;
  kind: string;
  roomId: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  materialSlots: Record<string, string>;
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
